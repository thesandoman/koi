import { KoiProvider } from "@/state";
import { Footer, Header, Hero, How, Join, Never } from "@/components/sections";

export default function App() {
  return (
    <KoiProvider>
      <Header />
      <main id="top">
        <Hero />
        <How />
        <Never />
        <Join />
      </main>
      <Footer />
    </KoiProvider>
  );
}
