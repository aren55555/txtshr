import "./index.css";
import { render } from "solid-js/web";
import App from "./App";

document.fonts.ready.then(() => {
  render(() => <App />, document.getElementById("root")!);
});
