import { createSignal, For, JSX, onCleanup, onMount, Show } from "solid-js";

export type SelectOption =
  | { value: string; label: string; subtitle?: string }
  | { value: string; content: JSX.Element };

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

const RendererSelect = (props: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  groups?: SelectGroup[];
}) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const refs = { container: null as HTMLDivElement | null };

  onMount(() => {
    const onOutside = (e: MouseEvent) => {
      if (refs.container && !refs.container.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    onCleanup(() => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    });
  });

  const allOptions = () => [
    ...props.options,
    ...(props.groups?.flatMap((g) => g.options) ?? []),
  ];

  const selectedLabel = () => {
    const opt = allOptions().find((o) => o.value === props.value);
    if (!opt) return props.value;
    return "content" in opt ? props.value : opt.label;
  };

  const select = (value: string) => { props.onChange(value); setIsOpen(false); };

  const renderOption = (option: SelectOption) => (
    <button
      type="button"
      onClick={() => select(option.value)}
      class={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition ${
        props.value === option.value ? "text-emerald-400" : "text-slate-200"
      }`}
    >
      {"content" in option
        ? option.content
        : <>
            <div class="break-all">{option.label}</div>
            <Show when={option.subtitle}>
              <div class="text-xs text-slate-500 mt-0.5">{option.subtitle}</div>
            </Show>
          </>
      }
    </button>
  );

  return (
    <div ref={(el) => (refs.container = el)} class="relative">
      <button
        type="button"
        id={props.id}
        onClick={() => setIsOpen((v) => !v)}
        class="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-2.5 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition cursor-pointer"
      >
        <span>{selectedLabel()}</span>
        <svg
          class={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen() ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
      </button>

      <Show when={isOpen()}>
        <div class="absolute left-1/2 -translate-x-1/2 z-10 mt-1.5 min-w-full w-max max-w-xs bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <For each={props.options}>
            {renderOption}
          </For>
          <For each={props.groups}>
            {(group) => (
              <>
                <div class="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-700/60">
                  {group.label}
                </div>
                <For each={group.options}>
                  {renderOption}
                </For>
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default RendererSelect;
