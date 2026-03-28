import { For, Show } from "solid-js";

const TerminalBlock = (props: { command: string; output?: string[] }) => {
  return (
    <pre class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
      <span class="text-slate-500">$ </span>
      <span class="text-slate-100">{props.command}</span>
      <Show when={props.output && props.output.length > 0}>
        {"\n"}
        <For each={props.output}>{(line, i) => <><span class="text-violet-400">{line}</span>{i() < (props.output?.length ?? 1) - 1 ? "\n" : ""}</>}</For>
      </Show>
    </pre>
  );
};

export default TerminalBlock;
