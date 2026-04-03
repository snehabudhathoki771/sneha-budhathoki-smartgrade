import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50"
    >
      {/* LEFT GRADIENT GLOW */}
      <div className="absolute top-[-120px] left-[-120px] h-[450px] w-[450px] rounded-full bg-emerald-300/30 blur-3xl"></div>

      {/* RIGHT GRADIENT GLOW */}
      <div className="absolute bottom-[-120px] right-[-120px] h-[450px] w-[450px] rounded-full bg-emerald-200/20 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-32 text-center">

        {/* Tag */}
        <div className="mb-6 inline-flex items-center rounded-full bg-emerald-100 px-5 py-2 text-sm font-medium text-emerald-700">
          Free Academic Grading System
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-tight">
          Simplify Academic
          <span className="block text-emerald-600">
            Performance Tracking
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-600">
          SmartGrade helps schools and colleges track performance, analyze
          results, and generate insightful reports — completely free.
        </p>

        {/* Buttons */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">

          <Link
            to="/login"
            className="rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md active:scale-[0.98]"
          >
            Get Started
          </Link>

          <a
            href="#features"
            className="rounded-xl border border-slate-300 px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Explore Features
          </a>

        </div>

      </div>
    </section>
  );
}