import { DemoBar } from "@/components/site/demo-bar";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Toaster } from "@/components/ui/toast";
import { CompareBar } from "@/components/vehicles/compare-bar";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a href="#conteudo" className="sr-only-focusable fixed left-3 top-3 z-[80] rounded-lg bg-ink px-4 py-3 text-white">
        Saltar para o conteúdo
      </a>
      <DemoBar text={settings.demoBanner} />
      <Header settings={settings} />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} />
      <CompareBar />
      <Toaster />
    </>
  );
}
