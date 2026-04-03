import { Link } from "react-router-dom";
import logo from "../assets/SGlogo.png";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* LOGO */}
        <div className="flex items-center gap-3 cursor-pointer">

          {/* CIRCLE */}
          <div className="h-10 w-10 rounded-full overflow-hidden bg-emerald-100">
            <img
              src={logo}
              alt="SmartGrade Logo"
              className="h-full w-full object-cover"
            />
          </div>

          {/* TEXT */}
          <span className="text-lg font-semibold tracking-tight text-slate-800">
            Smart<span className="text-emerald-500">Grade</span>
          </span>

        </div>

        {/* NAVIGATION */}
        <nav className="hidden items-center gap-8 text-base font-medium text-slate-600 md:flex">

          <a href="#home" className="relative group transition">
            Home
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
          </a>

          <a href="#features" className="relative group transition">
            Features
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
          </a>

          <a href="#about" className="relative group transition">
            About
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
          </a>

          <a href="#contact" className="relative group transition">
            Contact
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
          </a>

          {/* CTA BUTTON */}
          <Link
            to="/login"
            className="ml-4 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md active:scale-[0.98]"
          >
            Get Started
          </Link>

        </nav>

      </div>
    </header>
  );
}