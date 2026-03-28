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

export default InfoPopup;
