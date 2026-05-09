import Card from "./Card";
import Brand from "./Brand";
import Footer from "./Footer";

const PrivacyPage = () => {
  return (
    <main class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div class="w-full max-w-2xl space-y-4">
        <Card>
          <Brand />
          <p class="text-slate-300 text-sm leading-relaxed text-center">
            No data leaves your device. Encryption and decryption happen entirely in your browser.
            The server never sees your plaintext, your passphrase, or your URL fragment —
            it only ever receives the encrypted ciphertext embedded in the URL, and even that
            is never sent (browsers never include the{" "}
            <code class="font-mono text-slate-400 bg-slate-800 px-1 rounded">#</code>{" "}
            fragment in HTTP requests).
          </p>
        </Card>
        <div class="flex justify-center">
          <Footer />
        </div>
      </div>
    </main>
  );
};

export default PrivacyPage;
