import { createResource, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { decryptV1 } from "./utils/crypto";
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
import FragmentErrorToast from "./components/FragmentErrorToast";

interface FragmentParams {
  s: string;
  n: string;
  c: string;
  rendererSpec: RendererSpec | null;
}

type AppState = "trust-check" | "warn" | "entry" | "decrypting" | "rendering" | "success" | "renderer-error" | "error";

const parseFragment = (): { ok: true; params: FragmentParams } | { ok: false; reason: "empty" | "invalid" | "unsupported"; version?: string } => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { ok: false, reason: "empty" };

  const p = new URLSearchParams(hash);
  const v = p.get("v");
  const s = p.get("s");
  const n = p.get("n");
  const c = p.get("c");
  const r = p.get("r");

  if (!v || !s || !n || !c) return { ok: false, reason: "invalid" };
  if (v !== "1") return { ok: false, reason: "unsupported", version: v };

  const rendererSpec = r !== null ? parseRendererSpec(r) : null;
  if (r !== null && rendererSpec === null) return { ok: false, reason: "invalid" };

  return { ok: true, params: { s, n, c, rendererSpec } };
}


const App = () => {
  const parsed = parseFragment();

  if (!parsed.ok) {
    return (
      <>
        <Show when={parsed.reason !== "empty"}>
          <FragmentErrorToast reason={parsed.reason as "invalid" | "unsupported"} version={parsed.version} />
        </Show>
        <LandingPage />
      </>
    );
  }

  const { params } = parsed;
  const { rendererSpec } = params;
  const [appState, setAppState] = createSignal<AppState>(rendererSpec !== null ? "trust-check" : "entry");
  const [passphrase, setPassphrase] = createSignal("");
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
          setAppState("entry"); // trusted, same hash — skip warning
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

  const handleDecrypt = async (e: SubmitEvent) => {
    e.preventDefault();
    setAppState("decrypting");
    // Yield to the event loop so the "Decrypting…" state renders before the
    // CPU-intensive PBKDF2 derivation begins.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    try {
      const text = await decryptV1(params.s, params.n, params.c, passphrase());
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


  const activeRendererValue = () => {
    if (activeRenderer() === null) return "__plaintext__";
    const spec = activeRenderer()!;
    const canonical = formatRendererSpec(spec);
    const isUrlRenderer = rendererSpec !== null && canonical === formatRendererSpec(rendererSpec);
    return isUrlRenderer ? "__url_renderer__" : canonical;
  };

  return (
    <main class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
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
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
                </svg>
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
              <div class="bg-amber-300/10 border border-amber-300/[16] rounded-lg px-4 py-3 space-y-2">
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
                onClick={() => setAppState("entry")}
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
                <input
                  id="passphrase"
                  type="password"
                  autocomplete="off"
                  autofocus
                  value={passphrase()}
                  onInput={(e) => setPassphrase(e.currentTarget.value)}
                  disabled={appState() === "decrypting"}
                  class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50"
                  placeholder="Enter passphrase…"
                />
              </div>
              <Show when={appState() === "error"}>
                <p role="alert" class="text-sm text-red-400 bg-red-400/10 border border-red-400/[16] rounded-lg px-4 py-2.5">
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
              <p role="alert" class="text-sm text-amber-300 bg-amber-300/10 border border-amber-300/[16] rounded-lg px-4 py-2.5">
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
