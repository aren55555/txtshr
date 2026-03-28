import { createResource, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { decryptV1 } from "./utils/crypto";
import { formatRendererSpec, loadRenderer, parseRendererSpec, RendererSpec, resolveRendererURL } from "./utils/renderer";
import { getTrustRecord, recordDiscovery, saveTrustRecord } from "./utils/renderer-store";
import Card from "./components/Card";
import Brand from "./components/Brand";
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

type AppState = "warn" | "entry" | "decrypting" | "rendering" | "success" | "renderer-error" | "error";

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
          <FragmentErrorToast reason={parsed.reason as "invalid" | "unsupported"} version={(parsed as any).version} />
        </Show>
        <LandingPage />
      </>
    );
  }

  const { params } = parsed;
  const { rendererSpec } = params;
  const [appState, setAppState] = createSignal<AppState>(rendererSpec !== null ? "warn" : "entry");
  const [passphrase, setPassphrase] = createSignal("");
  const [decryptedText, setDecryptedText] = createSignal("");
  const [errorMsg, setErrorMsg] = createSignal("");
  const [copied, setCopied] = createSignal(false);
  const [activeRenderer, setActiveRenderer] = createSignal<RendererSpec | null>(rendererSpec);
  let rendererContainer!: HTMLDivElement;

  // Record that this renderer was encountered, regardless of whether the user proceeds.
  if (rendererSpec !== null) {
    const canonicalSpec = formatRendererSpec(rendererSpec);
    recordDiscovery(canonicalSpec);
  }

  // Load the trust record so the warn screen can show familiarity context.
  const [trustRecord] = rendererSpec !== null
    ? createResource(() => getTrustRecord(formatRendererSpec(rendererSpec)))
    : [() => null];

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
          const { renderer: mod, hash } = await loadRenderer(resolveRendererURL(rendererSpec));
          mod.render(rendererContainer, text);
          await saveTrustRecord(formatRendererSpec(rendererSpec), hash);
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

  return (
    <main class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Card>
        <Brand right={appState() === "success" && rendererSpec !== null
          ? <select
              id="renderer-select"
              value={activeRenderer() === null ? "__plaintext__" : "__remote__"}
              onChange={(e) => setActiveRenderer(e.currentTarget.value === "__plaintext__" ? null : rendererSpec)}
              class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            >
              <option value="__plaintext__">Plain text</option>
              <option value="__remote__">{formatRendererSpec(rendererSpec!)}</option>
            </select>
          : undefined
        } />
        <Switch>
          <Match when={appState() === "warn"}>
            <div class="space-y-4">
              <div class="bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-3 space-y-2">
                <p class="text-sm font-semibold text-amber-300">Third-party renderer</p>
                <p class="text-sm text-amber-200/80 leading-relaxed">
                  This link uses a renderer from{" "}
                  <code class="font-mono text-amber-100 bg-amber-900/50 px-1 rounded text-xs">
                    {formatRendererSpec(rendererSpec!)}
                  </code>
                  . The renderer will receive access to the decrypted content. Only proceed if you trust this source.
                </p>
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
                <p role="alert" class="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
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
              <p role="alert" class="text-sm text-amber-400 bg-amber-950/40 border border-amber-900/50 rounded-lg px-4 py-2.5">
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
        <Show when={rendererSpec !== null && (appState() === "rendering" || appState() === "success")}>
          <div ref={rendererContainer} class={appState() === "rendering" || activeRenderer() === null ? "hidden" : "min-h-16"} />
        </Show>
      </Card>
      <Footer />
    </main>
  );
}

export default App;
