export default function ModernNavbar({
  navigateHome,
  goMainHome,
  openClientAuth,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 shadow-[0_0_35px_rgba(168,85,247,0.35)]">
      <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8">
        {/* Logo */}
        <div
          onClick={goMainHome}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
            SH
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">ServiceHub</h1>
            <p className="text-xs font-medium text-white/80">
              Verified. Local. Reliable.
            </p>
          </div>
        </div>

        {/* Menu & Right Side Actions */}
        <div className="hidden lg:flex items-center gap-10 text-sm font-medium">
          <button
            onClick={goMainHome}
            className="rounded-full bg-purple-700 px-6 py-3 text-white shadow-lg"
          >
            Home
          </button>

          <button
            onClick={() => navigateHome("#services")}
            className="rounded-full bg-green-500 px-6 py-3 text-white shadow-lg"
          >
            Services
          </button>

          <button
            onClick={() => navigateHome("#providers")}
            className="rounded-full bg-orange-500 px-6 py-3 text-white shadow-lg"
          >
            Providers
          </button>

          <button
            onClick={() => navigateHome("#contact")}
            className="rounded-full bg-cyan-500 px-6 py-3 text-white shadow-lg"
          >
            Contact Us
          </button>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-4">
            {/* Working Login Button (Navigates to /contact) */}
            <button
              onClick={() => openClientAuth?.("login")}
              className="rounded-full bg-white px-5 py-2.5 font-medium text-slate-800"
            >
              Login
            </button>

            <button
              onClick={() => openClientAuth?.("register")}
              className="rounded-full bg-pink-500 px-6 py-2.5 font-semibold text-white shadow-lg"
            >
              Register
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
