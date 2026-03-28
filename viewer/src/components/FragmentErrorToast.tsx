import { createSignal, onMount } from "solid-js";

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

export default FragmentErrorToast;
