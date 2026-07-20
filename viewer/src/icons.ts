import EyeIcon from "~icons/heroicons/eye-20-solid";
import EyeSlashIcon from "~icons/heroicons/eye-slash-20-solid";
import CogIcon from "~icons/heroicons/cog-20-solid";
import InfoCircleIcon from "~icons/heroicons/information-circle-20-solid";
import LockOpenIcon from "~icons/heroicons/lock-open-20-solid";

export const ICONS = {
  eye: { component: EyeIcon, usage: "Show passphrase" },
  eyeSlash: { component: EyeSlashIcon, usage: "Hide passphrase" },
  cog: { component: CogIcon, usage: "Settings" },
  infoCircle: { component: InfoCircleIcon, usage: "Alert toast" },
  lockOpen: { component: LockOpenIcon, usage: "Unencrypted notice" },
} as const;

// For Toast component compatibility
export const TOAST_ICONS = {
  alert: ICONS.infoCircle.component,
  unlocked: ICONS.lockOpen.component,
} as const;
