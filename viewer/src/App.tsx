import { createSignal, Match, Show, Switch } from "solid-js";
import { decryptV1 } from "./crypto";

interface FragmentParams {
  s: string;
  n: string;
  c: string;
}

type AppState = "entry" | "decrypting" | "success" | "error";

const parseFragment = (): { ok: true; params: FragmentParams } | { ok: false; reason: "invalid" | "unsupported"; version?: string } => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { ok: false, reason: "invalid" };

  const p = new URLSearchParams(hash);
  const v = p.get("v");
  const s = p.get("s");
  const n = p.get("n");
  const c = p.get("c");

  if (!v || !s || !n || !c) return { ok: false, reason: "invalid" };
  if (v !== "1") return { ok: false, reason: "unsupported", version: v };

  return { ok: true, params: { s, n, c } };
}

function Card(props: { children: any }) {
  return (
    <div class="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 p-8">
      {props.children}
    </div>
  );
}

function Brand() {
  return (
    <div class="mb-6">
      <span class="font-mono text-2xl font-bold text-emerald-400 tracking-tight">txtshr</span>
    </div>
  );
}

export default function App() {
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
  const [appState, setAppState] = createSignal<AppState>("entry");
  const [passphrase, setPassphrase] = createSignal("");
  const [decryptedText, setDecryptedText] = createSignal("");
  const [errorMsg, setErrorMsg] = createSignal("");
  const [copied, setCopied] = createSignal(false);

  const handleDecrypt = async (e: SubmitEvent) => {
    e.preventDefault();
    setAppState("decrypting");
    // Yield to the event loop so the "Decrypting…" state renders before the
    // CPU-intensive PBKDF2 derivation begins.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    try {
      const text = await decryptV1(params.s, params.n, params.c, passphrase());
      setDecryptedText(text);
      setAppState("success");
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
        <Brand />
        <Switch>
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
            <div class="flex items-center gap-3 text-slate-400" aria-live="polite">
              <svg class="animate-spin h-5 w-5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm">Decrypting…</span>
            </div>
          </Match>

          <Match when={appState() === "success"}>
            <div class="space-y-4">
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
      </Card>
    </main>
  );
}
