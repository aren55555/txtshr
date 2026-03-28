/**
 * A remote renderer loaded by the txtshr viewer.
 *
 * The module must export a `render` function matching this interface.
 * If `render` returns a function, the viewer will call it when the renderer
 * is torn down (use it to clean up event listeners, timers, etc.).
 */
export interface RemoteRenderer {
  render(el: HTMLElement, text: string): void | (() => void);
}

/**
 * Identity helper that types your renderer object against the RemoteRenderer
 * interface. Use it to get compile-time type checking without a runtime cost.
 *
 * @example
 * import { defineRenderer } from 'txtshr-renderer';
 *
 * export const { render } = defineRenderer({
 *   render(el, text) {
 *     el.textContent = text;
 *   },
 * });
 */
export const defineRenderer = (r: RemoteRenderer): RemoteRenderer => r;
