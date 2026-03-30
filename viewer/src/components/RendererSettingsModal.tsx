import { createResource, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { deleteTrustRecord, getTrustedRenderers } from "../utils/renderer-store";
import { parseRendererSpec } from "../utils/renderer";

const sourceURL = (spec: string): string | null => {
  const parsed = parseRendererSpec(spec);
  if (!parsed) return null;
  const ref = parsed.version !== "latest" ? parsed.version : "HEAD";
  return `https://github.com/${parsed.owner}/${parsed.repo}/blob/${ref}/dist/${parsed.name}.js`;
};

const RendererSettingsModal = (props: {
  onClose: () => void;
  onForget: () => void;
}) => {
  const [renderers, { refetch }] = createResource(() => getTrustedRenderers());

  const handleForget = async (spec: string) => {
    await deleteTrustRecord(spec);
    refetch();
    props.onForget();
  };

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={props.onClose} />
        <div class="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-100">Trusted Renderers</h2>
            <button
              onClick={props.onClose}
              class="text-slate-400 hover:text-slate-200 transition focus:outline-none"
              aria-label="Close"
            >
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
          <Show when={!renderers.loading} fallback={
            <p class="text-sm text-slate-500">Loading…</p>
          }>
            <Show when={(renderers() ?? []).length > 0} fallback={
              <p class="text-sm text-slate-500">No trusted renderers stored locally.</p>
            }>
              <ul class="space-y-2">
                <For each={renderers()}>
                  {(r) => (
                    <li class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 space-y-2">
                      <p class="text-sm text-slate-200 font-mono break-all">{r.spec}</p>
                      <p class="text-xs text-slate-500 font-mono" title={r.hash}>SHA-256: {r.hash.slice(0, 16)}…</p>
                      <div class="flex items-center justify-between gap-3">
                        <div class="text-xs text-slate-500 space-y-0.5">
                          <p>First seen {new Date(r.firstSeen).toLocaleDateString()}</p>
                          <p>Last seen {new Date(r.lastSeen).toLocaleDateString()}</p>
                        </div>
                        <div class="shrink-0 flex items-center gap-1.5">
                          <Show when={sourceURL(r.spec)}>
                            <a
                              href={sourceURL(r.spec)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded px-2 py-1 transition"
                            >
                              <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                                <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                              </svg>
                              Source
                            </a>
                          </Show>
                          <button
                            onClick={() => handleForget(r.spec)}
                            class="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 border border-red-800/60 hover:border-red-600 rounded px-2 py-1 transition focus:outline-none"
                          >
                            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
                            </svg>
                            Forget
                          </button>
                        </div>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
          <hr class="border-slate-700" />
          <div class="space-y-2">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Building a renderer</p>
            <p class="text-xs text-slate-500 leading-relaxed">
              A renderer is an ES module hosted on GitHub that exports a{" "}
              <code class="font-mono text-slate-400 bg-slate-800 px-1 rounded">render(el, text)</code>{" "}
              function. The{" "}
              <a href="https://www.npmjs.com/package/txtshr-renderer" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 transition">txtshr-renderer</a>{" "}
              npm package provides TypeScript types.{" "}
              <br />
              <br />
              Publish your repo with a built file at{" "}
              <code class="font-mono text-slate-400 bg-slate-800 px-1 rounded">dist/{"<name>"}.js</code>{" "}
              and reference it in a txtshr URL using the format{" "}
              <code class="font-mono text-slate-400 bg-slate-800 px-1 rounded">owner/repo/name[@version]</code>.
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default RendererSettingsModal;
