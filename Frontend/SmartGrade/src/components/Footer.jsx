import logo from "../assets/SGlogo.png";

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 text-slate-300">
      
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* TOP GRID */}
        <div className="grid gap-12 md:grid-cols-3">

          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3">

              {/* CIRCLE LOGO */}
              <div className="h-10 w-10 rounded-full overflow-hidden bg-emerald-100">
                <img
                  src={logo}
                  alt="SmartGrade Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <span className="text-lg font-semibold text-white">
                Smart<span className="text-emerald-400">Grade</span>
              </span>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              A smarter way to manage academic performance with automation and analytics.
            </p>
          </div>

          {/* LINKS */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Quick Links
            </h3>

            <div className="mt-5 flex flex-col gap-3 text-sm">
              
              {["Home", "Features", "About", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="relative w-fit text-slate-400 transition duration-200 hover:text-white group"
                >
                  {item}
                  <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Get in Touch
            </h3>

            <p className="mt-5 text-sm text-slate-400 leading-relaxed">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

        </div>

        {/* DIVIDER */}
        <div className="my-12 h-px bg-slate-700" />

        {/* BOTTOM */}
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-slate-500 md:flex-row">
          <p>© 2026 SmartGrade. All rights reserved.</p>
          <p className="text-slate-600">Designed for modern education</p>
        </div>

      </div>
    </footer>
  );
}