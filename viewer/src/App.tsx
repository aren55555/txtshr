import { createResource, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { decryptV1 } from "./crypto";
import { formatRendererSpec, loadRenderer, parseRendererSpec, RendererSpec, resolveRendererURL } from "./renderer";
import { getTrustRecord, recordDiscovery, saveTrustRecord } from "./renderer-store";

declare const __GIT_SHA__: string;

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
      <span class="font-brand text-5xl font-bold text-emerald-400 tracking-tight">txtshr</span>
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

const Footer = () => {
  const sha = __GIT_SHA__;
  const shortSha = sha.slice(0, 7);
  return (
    <footer class="flex items-center gap-1.5 text-slate-500 text-xs">
      <a href="https://arenpatel.com" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition">
        Aren Patel
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="https://x.com/aren55555"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="@aren55555 on X"
        class="hover:text-slate-300 transition"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.633 5.905-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={`https://github.com/aren55555/txtshr/commit/${sha}`}
        target="_blank"
        rel="noopener noreferrer"
        class="font-mono hover:text-slate-300 transition"
      >
        {shortSha}
      </a>
      <span aria-hidden="true">·</span>
      <span class="text-slate-600" title="Made in Canada">
        {new Date().getFullYear()}
        {" "}
<svg class="inline w-4 h-4 opacity-50" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
          <path d="M383.8 351.7c2.5-2.5 105.2-92.4 105.2-92.4l-17.5-7.5c-10-4.9-7.4-11.5-5-17.4 2.4-7.6 20.1-67.3 20.1-67.3s-47.7 10-57.7 12.5c-7.5 2.4-10-2.5-12.5-7.5s-15-32.4-15-32.4-52.6 59.9-55.1 62.3c-10 7.5-20.1 0-17.6-10 0-10 27.6-129.6 27.6-129.6s-30.1 17.4-40.1 22.4c-7.5 5-12.6 5-17.6-5C293.5 72.3 255.9 0 255.9 0s-37.5 72.3-42.5 79.8c-5 10-10 10-17.6 5-10-5-40.1-22.4-40.1-22.4S183.3 182 183.3 192c2.5 10-7.5 17.5-17.6 10-2.5-2.5-55.1-62.3-55.1-62.3S98.1 167 95.6 172s-5 9.9-12.5 7.5C73 177 25.4 167 25.4 167s17.6 59.7 20.1 67.3c2.4 6 5 12.5-5 17.4L23 259.3s102.6 89.9 105.2 92.4c5.1 5 10 7.5 5.1 22.5-5.1 15-10.1 35.1-10.1 35.1s95.2-20.1 105.3-22.6c8.7-.9 18.3 2.5 18.3 12.5S241 512 241 512h30s-5.8-102.7-5.8-112.8 9.5-13.4 18.4-12.5c10 2.5 105.2 22.6 105.2 22.6s-5-20.1-10-35.1 0-17.5 5-22.5z" />
        </svg>
      </span>
    </footer>
  );
}

const LandingPage = () => {
  return (
    <main class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div class="w-full max-w-lg space-y-4">
        <Card>
          <div class="mb-6 flex items-center gap-2">
            <span class="font-brand text-5xl font-bold text-emerald-400 tracking-tight">txtshr</span>
          </div>
          <p class="text-slate-300 text-sm leading-relaxed mb-6">
            Share encrypted text via a URL. The passphrase never leaves your device — decryption happens entirely in your browser. Even the server can't read your message.
          </p>

          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Install</p>
              <pre class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-emerald-300 font-mono overflow-x-auto">go install github.com/aren55555/txtshr/cli@latest</pre>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Share text</p>
              <pre class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-emerald-300 font-mono overflow-x-auto">echo "secret message" | txtshr</pre>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Share a file</p>
              <pre class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-emerald-300 font-mono overflow-x-auto">cat notes.txt | txtshr</pre>
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-800">
            <div class="flex items-start gap-3">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
              </svg>
              <p class="text-xs text-slate-500 leading-relaxed">
                The URL fragment (everything after <code class="font-mono text-slate-400 bg-slate-800 px-1 rounded">#</code>) is never sent to any server — it's a browser guarantee. Encryption uses AES-256-GCM with PBKDF2-SHA256 key derivation.
              </p>
            </div>
          </div>
        </Card>
        <div class="flex justify-center">
          <a
            href="https://github.com/aren55555/txtshr"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs transition"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View source on GitHub
          </a>
        </div>
        <div class="flex justify-center">
          <Footer />
        </div>
      </div>
    </main>
  );
}

const FragmentErrorToast = (props: { reason: "invalid" | "unsupported"; version?: string }) => {
  const [visible, setVisible] = createSignal(true);

  onMount(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(fadeTimer);
  });

  return (
    <div
      role="alert"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm transition-opacity duration-700"
      style={{ opacity: visible() ? "1" : "0", "pointer-events": visible() ? "auto" : "none" }}
    >
      <div class="bg-red-950/80 backdrop-blur border border-red-800/60 rounded-xl shadow-xl px-4 py-3 flex items-start gap-3">
        <svg class="w-4 h-4 text-red-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
        </svg>
        <p class="text-sm text-red-200 leading-relaxed">
          {props.reason === "unsupported"
            ? <>Unsupported link version (<code class="font-mono text-red-100">{props.version}</code>). Please use a newer viewer.</>
            : <>Invalid share link — make sure you copied the full URL including the <code class="font-mono text-red-100">#fragment</code>.</>
          }
        </p>
      </div>
    </div>
  );
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
