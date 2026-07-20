import { createSignal, onMount, JSX } from "solid-js";
import InfoCircleIcon from "~icons/heroicons/information-circle-20-solid";
import LockOpenIcon from "~icons/heroicons/lock-open-20-solid";

// Icon components available to toast call sites.
export const TOAST_ICONS = {
  alert: InfoCircleIcon,
  unlocked: LockOpenIcon,
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
  /** One of TOAST_ICONS components. */
  icon: typeof TOAST_ICONS[keyof typeof TOAST_ICONS];
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
        <props.icon class={`w-4 h-4 mt-0.5 shrink-0 ${palette().icon}`} />
        <p class={`text-sm leading-relaxed ${palette().text}`}>{props.children}</p>
      </div>
    </div>
  );
}

export default Toast;
