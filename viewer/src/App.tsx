import { createResource, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { ICONS, TOAST_ICONS } from "./icons";
import { base64urlDecode } from "./utils/base64url";
import { Params, Scheme } from "./utils/scheme";
import { schemes } from "./utils/registry";
import { formatRendererSpec, loadRenderer, LoadedRenderer, parseRendererSpec, RendererSpec, resolveRendererURL } from "./utils/renderer";
import { getTrustRecord, getTrustedRenderers, recordDiscovery, saveTrustRecord } from "./utils/renderer-store";
import { relativeTime } from "./utils/relativeTime";
import Card from "./components/Card";
import Brand from "./components/Brand";
import RendererSelect from "./components/RendererSelect";
import RendererSettingsModal from "./components/RendererSettingsModal";
import Spinner from "./components/Spinner";
import Footer from "./components/Footer";
import LandingPage from "./components/LandingPage";
import Toast from "./components/Toast";

interface FragmentParams {
  scheme: Scheme;
  payload: Params;
  rendererSpec: RendererSpec | null;
}

type AppState = "trust-check" | "warn" | "entry" | "decrypting" | "rendering" | "success" | "renderer-error" | "error";

const parseFragment = (): { ok: true; params: FragmentParams } | { ok: false; reason: "empty" | "invalid" | "unsupported"; version?: string } => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { ok: false, reason: "empty" };

  const p = new URLSearchParams(hash);
  const v = p.get("v");
  if (!v) return { ok: false, reason: "invalid" };

  const scheme = schemes.get(v);
  if (!scheme) return { ok: false, reason: "unsupported", version: v };

  const r = p.get("r");
  const rendererSpec = r !== null ? parseRendererSpec(r) : null;
  if (r !== null && rendererSpec === null) return { ok: false, reason: "invalid" };

  // Every key except the reserved "v" and "r" is a base64url-encoded payload
  // parameter (SPEC.md §3); which of them are required is the scheme's call.
  const payload: Params = {};
  try {
    for (const [key, value] of p) {
      if (key === "v" || key === "r") continue;
      payload[key] = base64urlDecode(value);
    }
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!scheme.requiredParams.every((key) => key in payload)) return { ok: false, reason: "invalid" };

  return { ok: true, params: { scheme, payload, rendererSpec } };
}


const App = () => {
  const parsed = parseFragment();

  if (!parsed.ok) {
    return (
      <>
        <Show when={parsed.reason !== "empty"}>
          <Toast color="red" icon={TOAST_ICONS.alert} fadeAfterMs={4000}>
            {parsed.reason === "unsupported"
              ? <>Unsupported link version (<code class="font-mono text-red-200">{parsed.version}</code>). Please use a newer viewer.</>
              : <>Invalid share link — make sure you copied the full URL including the <code class="font-mono text-red-200">#fragment</code>.</>
            }
          </Toast>
        </Show>
        <LandingPage />
      </>
    );
  }

  const { params } = parsed;
  const { rendererSpec } = params;
  // Unencrypted content needs no passphrase: it is revealed on mount — after
  // the renderer trust flow when the link carries a renderer (SPEC.md §4.0).
  const [appState, setAppState] = createSignal<AppState>(
    rendererSpec !== null ? "trust-check" : params.scheme.encrypts ? "entry" : "decrypting"
  );
  const [passphrase, setPassphrase] = createSignal("");
  const [showPassphrase, setShowPassphrase] = createSignal(false);
  const [decryptedText, setDecryptedText] = createSignal("");
  const [errorMsg, setErrorMsg] = createSignal("");
  const [copied, setCopied] = createSignal(false);
  const [activeRenderer, setActiveRenderer] = createSignal<RendererSpec | null>(rendererSpec);
  const [rendererSwitching, setRendererSwitching] = createSignal(false);
  // Mutable instance variables grouped into a const object to avoid let bindings.
  const refs = {
    rendererContainer: null as HTMLDivElement | null,
    // Cached renderer from the trust-check pre-fetch (reused during rendering phase).
    cachedRenderer: null as LoadedRenderer | null,
    // Whether the pre-fetched hash differs from the stored trust record hash.
    rendererHashChanged: false,
    // Cleanup function returned by the active renderer's render() call.
    cleanupRenderer: null as (() => void) | null,
  };

  // Record that this renderer was encountered, regardless of whether the user proceeds.
  if (rendererSpec !== null) {
    const canonicalSpec = formatRendererSpec(rendererSpec);
    recordDiscovery(canonicalSpec);
  }

  // Load the trust record so the warn screen can show familiarity context.
  const [trustRecord] = rendererSpec !== null
    ? createResource(() => getTrustRecord(formatRendererSpec(rendererSpec)))
    : [() => null];

  // Load previously approved renderers for the dropdown.
  const [trustedRenderers, { refetch: refetchTrustedRenderers }] = createResource(() => getTrustedRenderers());
  const [settingsOpen, setSettingsOpen] = createSignal(false);

  // When there is a renderer spec, pre-fetch it immediately so we can:
  //   1. Compare its hash to the stored trust record (skip warn if they match).
  //   2. Cache the loaded module to avoid re-fetching during the rendering phase.
  if (rendererSpec !== null) {
    onMount(async () => {
      const canonicalSpec = formatRendererSpec(rendererSpec);
      const [loadResult, trust] = await Promise.allSettled([
        loadRenderer(resolveRendererURL(rendererSpec)),
        getTrustRecord(canonicalSpec),
      ]);

      if (loadResult.status === "fulfilled") {
        refs.cachedRenderer = loadResult.value;
        const stored = trust.status === "fulfilled" ? trust.value : null;
        if (stored && stored.hash === refs.cachedRenderer.hash) {
          proceedToContent(); // trusted, same hash — skip warning
        } else {
          refs.rendererHashChanged = stored !== null && stored.hash !== refs.cachedRenderer.hash;
          setAppState("warn");
        }
      } else {
        // Pre-fetch failed; show warn as usual (loadRenderer will fail again at render time).
        setAppState("warn");
      }
    });
  }

  // Shared tail of both version flows: show the plaintext, running the
  // renderer first if the link carries one.
  const revealText = async (text: string) => {
    setDecryptedText(text);
    if (rendererSpec !== null) {
      setAppState("rendering");
      // Yield so Solid can mount the renderer container div before we use it.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      try {
        const loaded = refs.cachedRenderer ?? await loadRenderer(resolveRendererURL(rendererSpec));
        const cleanup = loaded.renderer.render(refs.rendererContainer!, text);
        refs.cleanupRenderer = cleanup ?? null;
        await saveTrustRecord(formatRendererSpec(rendererSpec), loaded.hash);
        setAppState("success");
      } catch {
        setAppState("renderer-error");
      }
    } else {
      setAppState("success");
    }
  }

  // Where the flow goes once the renderer trust gate (if any) is passed:
  // encrypting schemes ask for the passphrase; non-encrypting ones have
  // nothing to unlock and reveal directly.
  const proceedToContent = () => {
    if (params.scheme.encrypts) {
      setAppState("entry");
    } else {
      void revealUnencrypted();
    }
  }

  const revealUnencrypted = async () => {
    try {
      await revealText(await params.scheme.decode(params.payload, ""));
    } catch {
      setErrorMsg("This link's content is malformed.");
      setAppState("error");
    }
  }

  // Non-encrypting scheme with no renderer: reveal as soon as we mount.
  if (rendererSpec === null && !params.scheme.encrypts) {
    onMount(() => proceedToContent());
  }

  const handleDecrypt = async (e: SubmitEvent) => {
    e.preventDefault();
    setAppState("decrypting");
    // Yield to the event loop so the "Decrypting…" state renders before the
    // CPU-intensive PBKDF2 derivation begins.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    try {
      const text = await params.scheme.decode(params.payload, passphrase());
      await revealText(text);
    } catch {
      setErrorMsg("Decryption failed — check your passphrase and try again.");
      setAppState("error");
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(decryptedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleRendererChange = async (spec: RendererSpec | null) => {
    setActiveRenderer(spec);
    if (spec === null) return;

    const canonicalSpec = formatRendererSpec(spec);
    // If the renderer to switch to is already cached (same as URL renderer), reuse it.
    const isCachedSpec = rendererSpec !== null && canonicalSpec === formatRendererSpec(rendererSpec);
    const existing = isCachedSpec ? refs.cachedRenderer : null;

    setRendererSwitching(true);
    try {
      const loaded = existing ?? await loadRenderer(resolveRendererURL(spec));
      // Clean up the previous renderer and clear the container.
      if (refs.cleanupRenderer) {
        refs.cleanupRenderer();
        refs.cleanupRenderer = null;
      }
      refs.rendererContainer!.innerHTML = "";
      const cleanup = loaded.renderer.render(refs.rendererContainer!, decryptedText());
      refs.cleanupRenderer = cleanup ?? null;
      await saveTrustRecord(canonicalSpec, loaded.hash);
    } catch {
      // If switching fails, fall back to plain text.
      setActiveRenderer(null);
    } finally {
      setRendererSwitching(false);
    }
  }

  // Renderers available in the dropdown: trusted renderers excluding the current URL renderer.
  const previousRenderers = () => {
    const currentSpec = rendererSpec !== null ? formatRendererSpec(rendererSpec) : null;
    return (trustedRenderers() ?? [])
      .filter((r) => r.spec !== currentSpec)
      .sort((a, b) => b.lastSeen - a.lastSeen);
  };


  // The unencrypted-content toast is position:fixed, so the layout doesn't
  // know it exists — reserve top padding while it is shown so the card never
  // sits underneath it.
  const showUnencryptedToast = () =>
    !params.scheme.encrypts && (appState() === "success" || appState() === "renderer-error");

  const activeRendererValue = () => {
    if (activeRenderer() === null) return "__plaintext__";
    const spec = activeRenderer()!;
    const canonical = formatRendererSpec(spec);
    const isUrlRenderer = rendererSpec !== null && canonical === formatRendererSpec(rendererSpec);
    return isUrlRenderer ? "__url_renderer__" : canonical;
  };

  return (
    <main class={`min-h-screen flex flex-col items-center justify-center gap-4 p-4 ${showUnencryptedToast() ? "pt-28" : ""}`}>
      <Card>
        <Brand right={appState() === "success"
          ? <div class="flex items-center gap-2">
              <RendererSelect
                  id="renderer-select"
                  value={activeRendererValue()}
                  onChange={(val) => {
                    if (val === "__plaintext__") {
                      if (refs.cleanupRenderer) { refs.cleanupRenderer(); refs.cleanupRenderer = null; }
                      setActiveRenderer(null);
                    } else if (val === "__url_renderer__") {
                      handleRendererChange(rendererSpec!);
                    } else {
                      const spec = parseRendererSpec(val);
                      if (spec) handleRendererChange(spec);
                    }
                  }}
                  options={[
                    { value: "__plaintext__", label: "Plain text" },
                  ]}
                  groups={[
                    ...(rendererSpec !== null ? [{
                      label: "Suggested by this link",
                      options: [{ value: "__url_renderer__", label: formatRendererSpec(rendererSpec), subtitle: trustRecord()?.lastSeen ? `Last used ${relativeTime(trustRecord()!.lastSeen)}` : undefined }],
                    }] : []),
                    ...(previousRenderers().length > 0 ? [{
                      label: "Previously used",
                      options: previousRenderers().map((r) => ({
                        value: r.spec,
                        label: r.spec,
                        subtitle: `Last used ${relativeTime(r.lastSeen)}`,
                      })),
                    }] : []),
                  ]}
                />
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                class="text-slate-400 hover:text-slate-200 transition focus:outline-none"
                aria-label="Renderer settings"
              >
                <ICONS.cog.component class="w-4 h-4" />
              </button>
            </div>
          : undefined
        } />
        <Show when={appState() === "success"}>
          <hr class="border-slate-700 mb-6" />
        </Show>
        <Switch>
          <Match when={appState() === "trust-check"}>
            <Spinner label="Checking renderer…" />
          </Match>

          <Match when={appState() === "warn"}>
            <div class="space-y-4">
              <div class="bg-amber-300/10 border border-amber-300/16 rounded-lg px-4 py-3 space-y-2">
                <h3 class="text-sm font-semibold text-amber-300">Third-party renderer</h3>
                <p class="text-sm text-amber-300/80 leading-relaxed">
                  This link uses a renderer from{" "}
                  <code class="font-mono text-amber-300 bg-amber-300/10 px-1 rounded text-xs">
                    {formatRendererSpec(rendererSpec!)}
                  </code>
                  . The renderer will receive access to the decrypted content. Only proceed if you trust this source.
                </p>
                <Show when={refs.rendererHashChanged}>
                  <p class="text-xs text-amber-300">Renderer code has changed since your last visit.</p>
                </Show>
              </div>
              <Show when={trustRecord()}>
                <p class="text-xs text-slate-500">
                  Previously loaded — first seen {new Date(trustRecord()!.firstSeen).toLocaleDateString()}.
                </p>
              </Show>
              <button
                onClick={proceedToContent}
                class="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Proceed
              </button>
            </div>
          </Match>

          <Match when={appState() === "entry" || appState() === "error"}>
            <form onSubmit={handleDecrypt} class="space-y-4">
              <div class="space-y-1.5">
                <label for="passphrase" class="block text-sm font-medium text-slate-300">
                  Passphrase
                </label>
                <div class="relative">
                  <input
                    id="passphrase"
                    type={showPassphrase() ? "text" : "password"}
                    autocomplete="off"
                    autofocus
                    value={passphrase()}
                    onInput={(e) => setPassphrase(e.currentTarget.value)}
                    disabled={appState() === "decrypting"}
                    class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 pr-11 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50"
                    placeholder="Enter passphrase…"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase((v) => !v)}
                    class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                    aria-label={showPassphrase() ? "Hide passphrase" : "Show passphrase"}
                  >
                    <Show
                      when={showPassphrase()}
                      fallback={
                        <ICONS.eye.component class="w-5 h-5" />
                      }
                    >
                      <ICONS.eyeSlash.component class="w-5 h-5" />
                    </Show>
                  </button>
                </div>
              </div>
              <Show when={appState() === "error"}>
                <p role="alert" class="text-sm text-red-400 bg-red-400/10 border border-red-400/16 rounded-lg px-4 py-2.5">
                  {errorMsg()}
                </p>
              </Show>
              <button
                type="submit"
                class="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decrypt
              </button>
            </form>
          </Match>

          <Match when={appState() === "decrypting"}>
            <Spinner label="Decrypting…" />
          </Match>

          <Match when={appState() === "rendering"}>
            <Spinner label="Loading renderer…" />
          </Match>

          <Match when={appState() === "success"}>
            <div class="space-y-4">
              <Show when={activeRenderer() === null}>
                <pre class="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono leading-relaxed">{decryptedText()}</pre>
                <button
                  onClick={handleCopy}
                  class="w-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 font-medium rounded-lg px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {copied() ? "Copied!" : "Copy to clipboard"}
                </button>
              </Show>
            </div>
          </Match>

          <Match when={appState() === "renderer-error"}>
            <div class="space-y-4">
              <p role="alert" class="text-sm text-amber-300 bg-amber-300/10 border border-amber-300/16 rounded-lg px-4 py-2.5">
                Renderer failed to load — showing plain text.
              </p>
              <pre class="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono leading-relaxed">{decryptedText()}</pre>
              <button
                onClick={handleCopy}
                class="w-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 font-medium rounded-lg px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {copied() ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
          </Match>
        </Switch>

        {/* Renderer container: mounted while loading and kept alive through success so
            the renderer's DOM is not torn down when the state transitions or the
            user toggles back to plain text view. */}
        <Show when={appState() === "rendering" || (appState() === "success" && activeRenderer() !== null)}>
          <div
            ref={el => (refs.rendererContainer = el)}
            class={appState() === "rendering" || rendererSwitching() ? "hidden" : "min-h-16"}
          />
        </Show>
        <Show when={rendererSwitching()}>
          <Spinner label="Loading renderer…" />
        </Show>
      </Card>
      {/* Security notice (SPEC.md §4.0): no fade — stays visible as long as
          the unencrypted content is shown. */}
      <Show when={showUnencryptedToast()}>
        <Toast color="amber" icon={TOAST_ICONS.unlocked}>
          Shared without encryption — anyone with the link can view it.
        </Toast>
      </Show>
      <Footer />
      <Show when={settingsOpen()}>
        <RendererSettingsModal
          onClose={() => setSettingsOpen(false)}
          onForget={() => refetchTrustedRenderers()}
        />
      </Show>
    </main>
  );
}

export default App;
