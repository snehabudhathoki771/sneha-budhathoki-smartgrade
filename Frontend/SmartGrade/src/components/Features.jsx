import {
  FaChartLine,
  FaUserCheck,
  FaFilePdf,
  FaBell,
  FaUsers,
  FaDatabase,
  FaUpload,
  FaClipboardList,
} from "react-icons/fa";

const features = [
  {
    title: "Automated GPA & Percentage Calculation",
    icon: <FaChartLine />,
  },
  {
    title: "Weak Area Detection & Personalized Feedback",
    icon: <FaUserCheck />,
  },
  {
    title: "Interactive Dashboards",
    icon: <FaChartLine />,
  },
  {
    title: "PDF Report Card Generation",
    icon: <FaFilePdf />,
  },
  {
    title: "Role-Based Access & Notifications",
    icon: <FaBell />,
  },
  {
    title: "Topper & At-Risk Student Identification",
    icon: <FaUsers />,
  },
  {
    title: "Assessment Structure Setup",
    icon: <FaClipboardList />,
  },
  {
    title: "Bulk Marks Import (CSV/Excel)",
    icon: <FaUpload />,
  },
  {
    title: "Term & Exam Management",
    icon: <FaDatabase />,
  },
];

function FeatureCard({ title, icon }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Top Accent Line */}
      <div className="absolute left-0 top-0 h-1 w-0 bg-emerald-500 transition-all duration-300 group-hover:w-full rounded-t-2xl"></div>

      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-all duration-300 group-hover:scale-110">
        <span className="text-lg">{icon}</span>
      </div>

      {/* Title */}
      <h3 className="mt-5 text-base font-semibold text-slate-900 leading-snug">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        Designed to simplify academic workflows and provide accurate insights.
      </p>

    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-24">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Powerful Features
          </h2>

          <p className="mt-4 text-base text-slate-600">
            Everything you need to manage academic performance efficiently and intelligently.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              icon={item.icon}
            />
          ))}
        </div>

      </div>
    </section>
  );
}