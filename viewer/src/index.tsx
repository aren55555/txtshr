import "./index.css";
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App";
import PrivacyPage from "./components/PrivacyPage";

document.fonts.ready.then(() => {
  render(() => (
    <Router>
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="*" component={App} />
    </Router>
  ), document.getElementById("root")!);
});
