import { Show } from "solid-js";
import InfoPopup from "./InfoPopup";

const Brand = (props: { right?: any }) => {
  return (
    <div class="mb-6 space-y-3">
      <div class="flex items-center justify-center gap-2">
        <span class="font-brand text-5xl font-bold text-emerald-400 tracking-tight">txtshr</span>
        <InfoPopup />
      </div>
      <Show when={props.right !== undefined}>
        <div class="flex justify-center">{props.right}</div>
      </Show>
    </div>
  );
}

export default Brand;
