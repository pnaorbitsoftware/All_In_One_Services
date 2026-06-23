export default function ModernNavbar({
  navigateHome,
  goMainHome,
  openClientAuth,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
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
            <h1 className="text-2xl font-bold text-slate-900">ServiceHub</h1>
            <p className="text-xs font-medium text-slate-500">
              Verified. Local. Reliable.
            </p>
          </div>
        </div>

        {/* Menu & Right Side Actions */}
        <div className="hidden lg:flex items-center gap-10 text-sm font-medium">
          <button
            onClick={goMainHome}
            className="border-b-2 border-blue-600 pb-2 text-blue-600"
          >
            Home
          </button>

          <button
            onClick={() => navigateHome("#services")}
            className="pb-2 text-slate-700 hover:text-blue-600"
          >
            Services
          </button>

          <button
            onClick={() => navigateHome("#providers")}
            className="pb-2 text-slate-700 hover:text-blue-600"
          >
            Providers
          </button>

          <button
            onClick={() => navigateHome("#contact")}
            className="pb-2 text-slate-700 hover:text-blue-600"
          >
            Contact Us
          </button>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-4">
            {/* Working Login Button (Navigates to /contact) */}
            <button
              onClick={() => openClientAuth?.("login")}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Login
            </button>

            <button
              onClick={() => openClientAuth?.("register")}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
            >
              Register
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
