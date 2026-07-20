import { createSignal, onMount, JSX } from "solid-js";

// Icon paths (20×20 solid) available to toast call sites.
export const TOAST_ICONS = {
  /** info/alert circle */
  alert: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z",
  /** open padlock (Heroicons 20/solid lock-open) */
  unlocked: "M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5V5.5a3 3 0 1 1 6 0v2.75a.75.75 0 0 0 1.5 0V5.5A4.5 4.5 0 0 0 14.5 1Z",
} as const;

// Full class strings per color — Tailwind's scanner only sees literal class
// names, so these cannot be built from string interpolation. Every color
// token used here must exist in brand/brand.json (Status group: amber-300
// warning, red-400 error, red-200 error body); Toast.test.ts enforces this.
export const TOAST_PALETTES = {
  red: {
    panel: "bg-red-400/30 border-red-400/49",
    icon: "text-red-400",
    text: "text-red-200",
  },
  amber: {
    panel: "bg-amber-300/30 border-amber-300/49",
    icon: "text-amber-300",
    text: "text-amber-300",
  },
} as const;

export type ToastColor = keyof typeof TOAST_PALETTES;

interface ToastProps {
  color: ToastColor;
  /** One of TOAST_ICONS (or any 20×20 solid SVG path). */
  iconPath: string;
  /** Fade out after this many milliseconds; omit to stay visible. */
  fadeAfterMs?: number;
  children: JSX.Element;
}

/**
 * Generic top-of-page toast: fixed and centered, translucent colored panel
 * with a leading icon and a single line of content.
 */
const Toast = (props: ToastProps) => {
  const [visible, setVisible] = createSignal(true);

  onMount(() => {
    if (props.fadeAfterMs === undefined) return;
    const fadeTimer = setTimeout(() => setVisible(false), props.fadeAfterMs);
    return () => clearTimeout(fadeTimer);
  });

  const palette = () => TOAST_PALETTES[props.color];

  return (
    <div
      role="alert"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm transition-opacity duration-700"
      style={{ opacity: visible() ? "1" : "0", "pointer-events": visible() ? "auto" : "none" }}
    >
      <div class={`backdrop-blur border rounded-xl shadow-xl px-4 py-3 flex items-start gap-3 ${palette().panel}`}>
        <svg class={`w-4 h-4 mt-0.5 shrink-0 ${palette().icon}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" clip-rule="evenodd" d={props.iconPath} />
        </svg>
        <p class={`text-sm leading-relaxed ${palette().text}`}>{props.children}</p>
      </div>
    </div>
  );
}

export default Toast;
