import { For, JSX, Show } from "solid-js";
import { splitCommandBrand } from "../utils/utils";

const chrome = { text: "text-slate-700", border: "border-slate-700" };
const brandColor = "text-emerald-400";

const renderCommand = (command: string) =>
  splitCommandBrand(command).map(({ text, highlight }) =>
    highlight
      ? <span class={brandColor}>{text}</span>
      : <span class="text-slate-100">{text}</span>
  );

const TerminalBlock = (props: { command: string; output?: (string | JSX.Element)[]; highlightBrand?: boolean }) => {
  return (
    <pre class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
      <span class={chrome.text}>$ </span>
      {props.highlightBrand ? renderCommand(props.command) : <span class="text-slate-100">{props.command}</span>}
      <Show when={props.output && props.output.length > 0}>
        <span class={`block mt-2 pl-3 border-l border-dashed ${chrome.border}`}>
          <For each={props.output}>{(line) => <span class="block text-violet-400">{line}</span>}</For>
        </span>
      </Show>
    </pre>
  );
};

export default TerminalBlock;
