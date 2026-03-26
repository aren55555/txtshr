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

export default function App() {
  const parsed = parseFragment();

  if (!parsed.ok) {
    return (
      <main>
        <h1>txtshr</h1>
        {parsed.reason === "unsupported"
          ? <p>This link was created with an unsupported scheme version ({parsed.version}). Please use a newer viewer.</p>
          : <p>Invalid or missing share link. Make sure you copied the full URL including the <code>#fragment</code>.</p>
        }
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
    <main>
      <h1>txtshr</h1>
      <Switch>
        <Match when={appState() === "entry" || appState() === "error"}>
          <form onSubmit={handleDecrypt}>
            <label for="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              autocomplete="off"
              autofocus
              value={passphrase()}
              onInput={(e) => setPassphrase(e.currentTarget.value)}
              disabled={appState() === "decrypting"}
            />
            <Show when={appState() === "error"}>
              <p role="alert">{errorMsg()}</p>
            </Show>
            <button type="submit">Decrypt</button>
          </form>
        </Match>

        <Match when={appState() === "decrypting"}>
          <p aria-live="polite">Decrypting…</p>
        </Match>

        <Match when={appState() === "success"}>
          <pre>{decryptedText()}</pre>
          <button onClick={handleCopy}>
            {copied() ? "Copied!" : "Copy to clipboard"}
          </button>
        </Match>
      </Switch>
    </main>
  );
}
