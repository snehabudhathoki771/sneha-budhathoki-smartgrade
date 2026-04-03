import { FaBolt, FaChartLine, FaFileAlt } from "react-icons/fa";

export default function About() {
  return (
    <section id="about" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-28 md:py-32">

        {/* Header */}
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            About SmartGrade
          </h2>

          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Built to simplify academic performance management through
            automation, analytics, and intelligent reporting.
          </p>
        </div>

        {/* Content Layout */}
        <div className="mt-16 grid gap-12 md:grid-cols-2 items-start">

          {/* LEFT TEXT */}
          <div>
            <p className="text-lg leading-7 text-slate-700">
              <span className="font-semibold text-emerald-600">
                SmartGrade
              </span>{" "}
              is a completely free academic management system designed to
              streamline grading, analytics, and reporting.
            </p>

            <p className="mt-5 text-lg leading-7 text-slate-600">
              It provides a structured platform for students, teachers, and administrators
              to monitor academic performance, identify learning gaps, and generate
              accurate reports efficiently.
            </p>

            <p className="mt-5 text-lg leading-7 text-slate-600">
              By automating calculations and offering insightful dashboards,
              institutions can make data-driven decisions while reducing manual effort.
            </p>
          </div>

          {/* RIGHT FEATURE HIGHLIGHTS */}
          <div className="grid gap-6">

            {/* ITEM 1 */}
            <div className="flex items-start gap-4 rounded-xl border border-slate-200 p-5 transition hover:shadow-md">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FaChartLine />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Smart Analytics
                </h4>
                <p className="text-sm text-slate-600">
                  Real-time insights into student performance.
                </p>
              </div>
            </div>

            {/* ITEM 2 */}
            <div className="flex items-start gap-4 rounded-xl border border-slate-200 p-5 transition hover:shadow-md">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FaBolt />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Automation
                </h4>
                <p className="text-sm text-slate-600">
                  Reduce manual grading and errors.
                </p>
              </div>
            </div>

            {/* ITEM 3 */}
            <div className="flex items-start gap-4 rounded-xl border border-slate-200 p-5 transition hover:shadow-md">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FaFileAlt />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Report Generation
                </h4>
                <p className="text-sm text-slate-600">
                  Generate detailed academic reports instantly.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}