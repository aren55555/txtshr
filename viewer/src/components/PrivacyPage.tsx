import Card from "./Card";
import Brand from "./Brand";
import Footer from "./Footer";
import { PRIVACY_NOTE } from "../marketing";

const PrivacyPage = () => {
  return (
    <main class="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div class="w-full max-w-2xl space-y-4">
        <Card>
          <Brand />
          <p class="text-slate-300 text-sm leading-relaxed text-center">{PRIVACY_NOTE}</p>
        </Card>
        <div class="flex justify-center">
          <Footer />
        </div>
      </div>
    </main>
  );
};

export default PrivacyPage;
