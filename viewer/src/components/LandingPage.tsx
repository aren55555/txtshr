import TabbedSelector from "./TabbedSelector";
import TerminalBlock from "./TerminalBlock";
import Card from "./Card";
import Footer from "./Footer";
import { IMG_URL } from "../utils/constant";
import { truncateUrl } from "../utils/utils";

const LandingPage = () => {
  return (
    <main class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div class="w-full max-w-2xl space-y-4">
        <Card>
          <div class="mb-6 flex items-center justify-center gap-2">
            <span class="font-brand text-5xl font-bold text-emerald-400 tracking-tight">txtshr</span>
          </div>
          <p class="text-slate-300 text-sm leading-relaxed mb-6">
            Share encrypted text via a URL. The passphrase never leaves your device — decryption happens entirely in your browser. Even the server can't read your message.
          </p>

          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Install</p>
              <TabbedSelector tabs={[
                { title: "Mac (brew)", content: <TerminalBlock command="brew install aren55555/tap/txtshr" /> },
                { title: "go", content: <TerminalBlock command="go install github.com/aren55555/txtshr/cli@latest" /> },
              ]} />
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Usage</p>
              <TabbedSelector tabs={[
                { title: "Share text", content: <TerminalBlock command='echo "secret message" | txtshr -password demo' highlightBrand output={[<a href="https://txtshr.run/#c=66lCuX9ITDy4_3pt55cETSJoonKY6ZRt5cpV4fkV6A&n=vYbEaAamnXzfg4JN&s=3CdNmFsFwcuhpHDjuIEQjg&v=1" target="_blank" rel="noopener noreferrer" class="underline hover:text-violet-300">https://txtshr.run/#c=66lCuX9ITDy4_3pt55cETSJoonKY6ZRt5cpV4fkV6A&n=vYbEaAamnXzfg4JN&s=3CdNmFsFwcuhpHDjuIEQjg&v=1</a>]} /> },
                { title: "Share a file", content: <TerminalBlock command="cat notes.txt | txtshr -password demo" highlightBrand output={[<a href="https://txtshr.run/#c=J8tvGjFMz0lBbwz0o4pbqZMFHU6rcSmv-Rq2ETygyUAE0Ms&n=RJXc2D1a8S4YlY4V&s=SY2UMBCqxhcYNqyYSUJ_eQ&v=1" target="_blank" rel="noopener noreferrer" class="underline hover:text-violet-300">https://txtshr.run/#c=J8tvGjFMz0lBbwz0o4pbqZMFHU6rcSmv-Rq2ETygyUAE0Ms&n=RJXc2D1a8S4YlY4V&s=SY2UMBCqxhcYNqyYSUJ_eQ&v=1</a>]} /> },
                { title: "Share an image", content: <TerminalBlock command="cat notes.txt | txtshr -password demo" highlightBrand output={[<a href={IMG_URL} target="_blank" rel="noopener noreferrer" class="underline hover:text-violet-300">{truncateUrl(IMG_URL)}</a>]} /> },
              ]} />
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-800">
            <div class="flex items-start gap-3">
              <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-slate-400 leading-relaxed">
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

export default LandingPage;
