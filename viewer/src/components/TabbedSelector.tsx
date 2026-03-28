import { createSignal, JSX } from "solid-js";

interface Tab {
  title: string;
  content: JSX.Element;
}

const TabbedSelector = (props: { tabs: Tab[] }) => {
  const [activeIndex, setActiveIndex] = createSignal(0);
  return (
    <div>
      <div class="flex gap-1 mb-2">
        {props.tabs.map((t, i) => (
          <button
            type="button"
            onClick={() => setActiveIndex(i)}
            class={`px-3 py-1 rounded-md text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              activeIndex() === i
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>
      {props.tabs[activeIndex()]?.content}
    </div>
  );
};

export default TabbedSelector;
