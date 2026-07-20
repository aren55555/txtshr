import { render } from "solid-js/web";
import { createSignal, For, Show, JSX } from "solid-js";
import "./index.css";

import Brand from "@viewer/components/Brand";
import Card from "@viewer/components/Card";
import Footer from "@viewer/components/Footer";
import RendererSelect from "@viewer/components/RendererSelect";
import RendererSettingsModal from "@viewer/components/RendererSettingsModal";
import Spinner from "@viewer/components/Spinner";
import TabbedSelector from "@viewer/components/TabbedSelector";
import TerminalBlock from "@viewer/components/TerminalBlock";
import Toast, { TOAST_ICONS } from "@viewer/components/Toast";
import { ICONS } from "@viewer/icons";

const SECTIONS = [
  { id: "icons", title: "Icons" },
  { id: "toast", title: "Toast" },
  { id: "brand", title: "Brand" },
  { id: "card", title: "Card" },
  { id: "spinner", title: "Spinner" },
  { id: "terminal", title: "TerminalBlock" },
  { id: "tabs", title: "TabbedSelector" },
  { id: "select", title: "RendererSelect" },
  { id: "modal", title: "RendererSettingsModal" },
  { id: "footer", title: "Footer" },
] as const;

const Section = (props: { id: string; title: string; children: JSX.Element }) => (
  <section id={props.id} class="mb-20 scroll-mt-8">
    <h2 class="text-xs uppercase tracking-[0.22em] text-slate-500 border-b border-slate-800 pb-3 mb-8">
      {props.title}
    </h2>
    <div class="space-y-8">{props.children}</div>
  </section>
);

const Variant = (props: { label: string; children: JSX.Element }) => (
  <div>
    <div class="text-[10px] uppercase tracking-[0.15em] text-slate-600 mb-3">{props.label}</div>
    {props.children}
  </div>
);

// Toasts position themselves with `fixed`; a transformed ancestor becomes
// their containing block, so this frame captures them instead of the viewport.
const FixedFrame = (props: { children: JSX.Element }) => (
  <div
    class="relative h-28 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
    style={{ transform: "translateZ(0)" }}
  >
    {props.children}
  </div>
);

const GalleryPage = () => {
  const [selectValue, setSelectValue] = createSignal("__plaintext__");
  const [modalOpen, setModalOpen] = createSignal(false);
  // Starts at 1 (truthy) so the fading toast is visible on load; each
  // increment remounts it via the keyed <Show>, replaying the fade.
  const [fadeKey, setFadeKey] = createSignal(1);

  return (
    <div class="grid grid-cols-[200px_1fr] min-h-screen">
      <nav class="sticky top-0 h-screen overflow-y-auto border-r border-slate-800 p-6 flex flex-col gap-0.5">
        <a href="#" class="font-brand text-2xl text-emerald-400 no-underline mb-1">txtshr</a>
        <div class="text-[9px] uppercase tracking-[0.2em] text-slate-600 mb-2">Component gallery</div>
        <For each={SECTIONS}>
          {(s) => (
            <a href={`#${s.id}`} class="text-xs text-slate-400 hover:text-slate-100 rounded px-2 py-1 hover:bg-slate-800/50 transition no-underline">
              {s.title}
            </a>
          )}
        </For>
      </nav>

      <main class="p-12 max-w-3xl">
        <Section id="icons" title="Icons">
          <div class="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
            <For each={Object.entries(ICONS)}>
              {([key, icon]) => (
                <div class="space-y-2">
                  <div class="flex items-center justify-center h-16 rounded-lg bg-slate-900 border border-slate-800">
                    <icon.component class="w-6 h-6 text-slate-300" />
                  </div>
                  <div class="space-y-0.5">
                    <div class="text-xs font-mono text-slate-400">{key}</div>
                    <div class="text-[11px] text-slate-600">{icon.usage}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Section>

        <Section id="toast" title="Toast">
          <Variant label="amber · persistent (unencrypted notice)">
            <FixedFrame>
              <Toast color="amber" icon={TOAST_ICONS.unlocked}>
                Shared without encryption — anyone with the link can view it.
              </Toast>
            </FixedFrame>
          </Variant>
          <Variant label="red · fadeAfterMs=4000 (fragment errors)">
            <FixedFrame>
              <Show when={fadeKey()} keyed>
                {(_) => (
                  <Toast color="red" icon={TOAST_ICONS.alert} fadeAfterMs={4000}>
                    Invalid share link — make sure you copied the full URL including the{" "}
                    <code class="font-mono text-red-200">#fragment</code>.
                  </Toast>
                )}
              </Show>
            </FixedFrame>
            <button
              type="button"
              onClick={() => setFadeKey((k) => k + 1)}
              class="mt-2 text-xs text-slate-400 hover:text-slate-100 border border-slate-700 rounded px-2 py-1 transition"
            >
              Replay fade
            </button>
          </Variant>
        </Section>

        <Section id="brand" title="Brand">
          <Variant label="default">
            <Brand />
          </Variant>
          <Variant label="with right slot">
            <Brand right={<span class="text-xs text-slate-400">right slot content</span>} />
          </Variant>
        </Section>

        <Section id="card" title="Card">
          <Card>
            <p class="text-sm text-slate-300">
              The standard content surface — slate-900, rounded-2xl, heavy shadow.
            </p>
          </Card>
        </Section>

        <Section id="spinner" title="Spinner">
          <Variant label="decrypting">
            <Spinner label="Decrypting…" />
          </Variant>
          <Variant label="loading renderer">
            <Spinner label="Loading renderer…" />
          </Variant>
        </Section>

        <Section id="terminal" title="TerminalBlock">
          <Variant label="command + output, highlightBrand">
            <TerminalBlock
              command="cat notes.md | txtshr"
              highlightBrand
              output={["https://txtshr.run/#c=…&n=…&s=…&v=1"]}
            />
          </Variant>
          <Variant label="command only">
            <TerminalBlock command="brew install aren55555/tap/txtshr" />
          </Variant>
        </Section>

        <Section id="tabs" title="TabbedSelector">
          <TabbedSelector
            tabs={[
              { title: "macOS", content: <TerminalBlock command="brew install aren55555/tap/txtshr" /> },
              { title: "Linux", content: <TerminalBlock command="curl -sSfL https://txtshr.run/install.sh | sh" /> },
            ]}
          />
        </Section>

        <Section id="select" title="RendererSelect">
          <div class="flex items-center gap-3">
            <RendererSelect
              id="gallery-renderer-select"
              value={selectValue()}
              onChange={setSelectValue}
              options={[{ value: "__plaintext__", label: "Plain text" }]}
              groups={[
                {
                  label: "Suggested by this link",
                  options: [
                    { value: "__url_renderer__", label: "aren55555/txtshr-renderers/jpeg", subtitle: "Last used 2 days ago" },
                  ],
                },
                {
                  label: "Previously used",
                  options: [
                    { value: "aren55555/txtshr-renderers/markdown", label: "aren55555/txtshr-renderers/markdown", subtitle: "Last used 5 days ago" },
                  ],
                },
              ]}
            />
            <span class="text-xs text-slate-500">value: <code class="font-mono">{selectValue()}</code></span>
          </div>
        </Section>

        <Section id="modal" title="RendererSettingsModal">
          <p class="text-xs text-slate-500 mb-3">
            Lists trust records from this browser's localStorage — may be empty in the gallery.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            class="text-sm text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2 transition"
          >
            Open modal
          </button>
          <Show when={modalOpen()}>
            <RendererSettingsModal onClose={() => setModalOpen(false)} onForget={() => {}} />
          </Show>
        </Section>

        <Section id="footer" title="Footer">
          <Footer />
        </Section>
      </main>
    </div>
  );
};

render(() => <GalleryPage />, document.getElementById("root")!);
