import { JSX, Show } from "solid-js";
import InfoPopup from "./InfoPopup";

const Brand = (props: { right?: JSX.Element }) => {
  return (
    <div class="mb-6 space-y-3">
      <div class="flex items-center justify-center gap-2">
        <a href="/" class="font-brand text-5xl font-bold text-emerald-400 tracking-tight no-underline">txtshr</a>
        <InfoPopup />
      </div>
      <Show when={props.right !== undefined}>
        <div class="flex justify-center">{props.right}</div>
      </Show>
    </div>
  );
}

export default Brand;
