import { createResource, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { deleteTrustRecord, getTrustedRenderers } from "../utils/renderer-store";

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
        <div class="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-6 space-y-4">
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
                    <li class="flex items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5">
                      <div class="min-w-0">
                        <p class="text-sm text-slate-200 font-mono break-all">{r.spec}</p>
                        <p class="text-xs text-slate-500 mt-0.5">
                          First seen {new Date(r.firstSeen).toLocaleDateString()}
                          {" · "}
                          Last seen {new Date(r.lastSeen).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleForget(r.spec)}
                        class="shrink-0 text-xs text-red-400 hover:text-red-300 border border-red-800/60 hover:border-red-600 rounded px-2 py-1 transition focus:outline-none"
                      >
                        Forget
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>
      </div>
    </Portal>
  );
};

export default RendererSettingsModal;
