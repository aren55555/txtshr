import { createSignal, Match, Show, Switch } from "solid-js";
import { decryptV1 } from "./crypto";
import { formatRendererSpec, loadRenderer, parseRendererSpec, RendererSpec, resolveRendererURL } from "./renderer";

interface FragmentParams {
  s: string;
  n: string;
  c: string;
  rendererSpec: RendererSpec | null;
}

type AppState = "warn" | "entry" | "decrypting" | "rendering" | "success" | "renderer-error" | "error";

const parseFragment = (): { ok: true; params: FragmentParams } | { ok: false; reason: "invalid" | "unsupported"; version?: string } => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { ok: false, reason: "invalid" };

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

const Card = (props: { children: any }) => {
  return (
    <div class="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 p-8">
      {props.children}
    </div>
  );
}

const InfoPopup = () => {
  return (
    <div class="relative inline-flex items-center group">
      <button
        type="button"
        aria-label="About txtshr"
        class="text-slate-500 hover:text-slate-300 transition focus:outline-none focus:text-slate-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
        </svg>
      </button>
      <div
        role="tooltip"
        class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
      >
        <div class="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4 text-sm text-slate-300 leading-relaxed">
          <p class="font-semibold text-slate-100 mb-2">100% zero-knowledge</p>
          <p class="mb-2">
            <strong class="text-emerald-400">txtshr</strong> lets you share encrypted text via a URL. The passphrase never leaves your device — decryption happens entirely in your browser using the Web Crypto API.
          </p>
          <p>
            The URL fragment (everything after <code class="font-mono text-slate-200 bg-slate-900 px-1 rounded">#</code>) is <em>never sent to any server</em> — it's a browser guarantee. Even we can't read your message.
          </p>
        </div>
        <div class="w-2.5 h-2.5 bg-slate-800 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1.5" />
      </div>
    </div>
  );
}

const Brand = (props: { right?: any }) => {
  return (
    <div class="mb-6 flex items-center gap-2">
      <span class="font-mono text-2xl font-bold text-emerald-400 tracking-tight">txtshr</span>
      <InfoPopup />
      <Show when={props.right !== undefined}>
        <div class="ml-auto">{props.right}</div>
      </Show>
    </div>
  );
}

const Spinner = (props: { label: string }) => {
  return (
    <div class="flex items-center gap-3 text-slate-400" aria-live="polite">
      <svg class="animate-spin h-5 w-5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="text-sm">{props.label}</span>
    </div>
  );
}

const App = () => {
  const parsed = parseFragment();

  if (!parsed.ok) {
    return (
      <main class="min-h-screen flex items-center justify-center p-4">
        <Card>
          <Brand />
          <p class="text-slate-400 text-sm leading-relaxed">
            {parsed.reason === "unsupported"
              ? <>This link was created with an unsupported scheme version (<code class="font-mono text-slate-300">{parsed.version}</code>). Please use a newer viewer.</>
              : <>Invalid or missing share link. Make sure you copied the full URL including the <code class="font-mono text-slate-300">#fragment</code>.</>
            }
          </p>
        </Card>
      </main>
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
          const mod = await loadRenderer(resolveRendererURL(rendererSpec));
          mod.render(rendererContainer, text);
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
    <main class="min-h-screen flex items-center justify-center p-4">
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
    </main>
  );
}

export default App;
