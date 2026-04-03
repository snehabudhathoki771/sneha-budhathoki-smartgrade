import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex flex-col">

        {/* Hero Section */}
        <section className="relative">
          <Hero />
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <Features />
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <About />
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}