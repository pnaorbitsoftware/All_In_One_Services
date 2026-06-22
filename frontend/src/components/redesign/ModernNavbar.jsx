import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronDown,
  CheckCircle,
  Languages,
  MapPin,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  UserRoundCheck,
  Wallet,
  X,
  Bell,
} from "lucide-react";

const ModernNavbar = ({
  navScrolled = false,
  SERVICEHUB_ICON = "",
  user = null,
  activeView = "client",
  providerDashboardNavLabel = "Workspace",
  language = "en",
  supportedLanguages = [
    { code: "en", label: "English", short: "EN" },
    { code: "hi", label: "हिंदी", short: "HI" },
    { code: "mr", label: "मराठी", short: "MR" },
  ],
  isDark = false,
  mainNavItems = [],
  accountMenuOpen = false,
  loginMenuOpen = false,
  moreMenuOpen = false,
  mobileNavOpen = false,
  accountMenuRef,
  loginMenuRef,
  moreMenuRef,
  t = (key) => key,
  setTheme = () => {},
  setLanguage = () => {},
  setActiveView = () => {},
  setAccountMenuOpen = () => {},
  setLoginMenuOpen = () => {},
  setMoreMenuOpen = () => {},
  setMobileNavOpen = () => {},
  navigateHome = () => {},
  goMainHome = () => {},
  handleHomeNav = () => {},
  isNavActive = () => false,
  openClientAuth = () => {},
  openProviderAuth = () => {},
  openProfileMenu = () => {},
  loadProviderDashboard = () => {},
  loadAdminDashboard = () => {},
  handleLogout = () => {},
  setStatusMessage = () => {},
}) => {
  // Safe handler for logo click
  const handleLogoClick = () => {
    if (typeof goMainHome === "function") goMainHome();
    else if (typeof handleHomeNav === "function") handleHomeNav();
    else if (typeof navigateHome === "function") navigateHome();
  };

  // Safe shortcode finder
  const currentLangShort = Array.isArray(supportedLanguages)
    ? supportedLanguages.find((l) => l?.code === language)?.short || "EN"
    : "EN";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-all duration-300 sm:px-5 ${navScrolled ? "pb-2" : "pb-3"}`}
    >
      <nav
        className={`mx-auto flex max-w-[96rem] items-center justify-between gap-3 rounded-[1.35rem] border px-4 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-white/45 backdrop-blur-2xl transition-all duration-300 dark:ring-white/10 sm:px-5 lg:px-6 ${navScrolled ? "h-16 border-white/80 bg-white/88 dark:border-white/10 dark:bg-slate-950/82" : "h-20 border-white/70 bg-white/74 dark:border-white/10 dark:bg-slate-950/66"}`}
      >
        {/* LOGO SECTION */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="group flex min-w-0 flex-none items-center gap-3 rounded-2xl pr-2 transition hover:bg-white/55 dark:hover:bg-white/5"
        >
          <span
            className={`grid place-items-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl shadow-blue-600/20 ring-1 ring-slate-200/80 transition-all duration-300 group-hover:-translate-y-0.5 dark:ring-white/15 ${navScrolled ? "h-10 w-10" : "h-12 w-12"}`}
          >
            {SERVICEHUB_ICON && (
              <img
                src={SERVICEHUB_ICON}
                alt="ServiceHub symbol"
                className="h-full w-full rounded-xl object-contain"
              />
            )}
          </span>
          <span className="leading-tight text-left">
            <span className="block text-xl font-black tracking-tight">
              {" "}
              ServiceHub{" "}
            </span>
            <span className="hidden text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 sm:block">
              {" "}
              {typeof t === "function"
                ? t("verifiedLocalServices")
                : "Verified Local Services"}{" "}
            </span>
          </span>
        </button>

        {/* DESKTOP NAV ITEMS */}
        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-white/82 p-1.5 text-sm font-black text-slate-500 shadow-[0_10px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            {Array.isArray(mainNavItems) &&
              mainNavItems.map((item) => {
                if (!item) return null;
                const Icon = item.icon || Menu;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={
                      item.id === "top"
                        ? handleHomeNav || navigateHome
                        : () => navigateHome(`#${item.id}`)
                    }
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition ${typeof isNavActive === "function" && isNavActive(item.id) ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}
                  >
                    <Icon className="flex-none" size={16} />
                    <span className="whitespace-nowrap"> {item.label} </span>
                  </button>
                );
              })}

            {/* ROLE BASED DASHBOARD BUTTONS */}
            {user?.role === "user" && (
              <button
                type="button"
                onClick={() => setActiveView("client")}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition ${activeView === "client" ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}
              >
                <CalendarCheck className="flex-none" size={16} />
                <span className="whitespace-nowrap">
                  {" "}
                  {typeof t === "function" ? t("dashboard") : "Dashboard"}{" "}
                </span>
              </button>
            )}
            {user?.role === "provider" && (
              <button
                type="button"
                onClick={loadProviderDashboard}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition ${["provider", "client"].includes(activeView) ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}
              >
                <BriefcaseBusiness className="flex-none" size={16} />
                <span className="whitespace-nowrap">
                  {" "}
                  {providerDashboardNavLabel}{" "}
                </span>
              </button>
            )}
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={loadAdminDashboard}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition ${activeView === "admin" ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"}`}
              >
                <ShieldCheck className="flex-none" size={16} />
                <span className="whitespace-nowrap">
                  {" "}
                  {typeof t === "function" ? t("admin") : "Admin"}{" "}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP RIGHT CONTROL */}
        <div className="hidden flex-none items-center gap-2 lg:flex xl:gap-3">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`grid h-11 w-11 place-items-center rounded-full border shadow-sm transition hover:-translate-y-0.5 ${isDark ? "border-black bg-black text-white" : "border-slate-200 bg-white text-slate-950"}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(!accountMenuOpen);
                    setLoginMenuOpen(false);
                    setMoreMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                >
                  <UserRoundCheck size={20} /> Account{" "}
                  <ChevronDown
                    size={15}
                    className={`transition ${accountMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-12 z-[75] w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white py-4 text-slate-800 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
                    <p className="px-5 pb-3 text-lg font-black text-slate-800 dark:text-white">
                      {" "}
                      Your Account{" "}
                    </p>
                    {[
                      {
                        label: "My Profile",
                        icon: UserRoundCheck,
                        action: openProfileMenu,
                      },
                      {
                        label:
                          user.role === "provider"
                            ? "Provider Dashboard"
                            : user.role === "admin"
                              ? "Admin Dashboard"
                              : "Client Dashboard",
                        icon: CalendarCheck,
                        action: () => {
                          if (user.role === "provider") loadProviderDashboard();
                          else if (user.role === "admin") loadAdminDashboard();
                          else setActiveView("client");
                        },
                      },
                      {
                        label: "Services",
                        icon: BriefcaseBusiness,
                        action: () => navigateHome("#services"),
                      },
                      {
                        label: "Providers",
                        icon: MapPin,
                        action: () => navigateHome("#providers"),
                      },
                      {
                        label: "Coupons",
                        icon: Sparkles,
                        action: () =>
                          setStatusMessage("Coupons will be available soon."),
                      },
                      {
                        label: "ServiceHub Plus Zone",
                        icon: Star,
                        action: () =>
                          setStatusMessage(
                            "ServiceHub Plus will be available soon.",
                          ),
                      },
                      {
                        label: "Saved Cards & Wallet",
                        icon: Wallet,
                        action: () =>
                          setStatusMessage(
                            "Saved cards and wallet will be available soon.",
                          ),
                      },
                      {
                        label: "Saved Addresses",
                        icon: MapPin,
                        action: openProfileMenu,
                      },
                      {
                        label: "Gift Cards",
                        icon: Wallet,
                        action: () =>
                          setStatusMessage(
                            "Gift cards will be available soon.",
                          ),
                      },
                      {
                        label: "Notifications",
                        icon: Bell,
                        action: () =>
                          setStatusMessage(
                            "Notifications are shown inside your dashboard.",
                          ),
                      },
                      {
                        label: "Logout",
                        icon: ArrowRight,
                        action: handleLogout,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            item.action();
                          }}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left text-base font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Icon size={20} className="flex-none" /> {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div ref={moreMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(!moreMenuOpen);
                    setAccountMenuOpen(false);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <Languages size={17} />
                  <span>{currentLangShort}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${moreMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {moreMenuOpen && Array.isArray(supportedLanguages) && (
                  <div className="absolute right-0 top-13 z-[75] w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang?.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang?.code);
                          setMoreMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold transition ${language === lang?.code ? "bg-blue-50 text-blue-600 dark:bg-white/10 dark:text-white" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}
                      >
                        <span>{lang?.label}</span>
                        {language === lang?.code && (
                          <CheckCircle
                            size={15}
                            className="text-blue-600 dark:text-white"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div ref={loginMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMenuOpen(!loginMenuOpen);
                    setMoreMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                >
                  <UserRoundCheck size={19} />{" "}
                  {typeof t === "function" ? t("login") : "Login"}{" "}
                  <ChevronDown
                    size={15}
                    className={`transition ${loginMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {loginMenuOpen && (
                  <div className="absolute right-0 top-12 z-[75] w-80 overflow-hidden rounded-b-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMenuOpen(false);
                        openClientAuth("login");
                      }}
                      className="flex w-full items-center gap-4 px-5 py-3.5 text-left text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <UserRoundCheck size={20} className="text-slate-400" />{" "}
                      Client Login / Register
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMenuOpen(false);
                        openProviderAuth("login");
                      }}
                      className="flex w-full items-center gap-4 px-5 py-3.5 text-left text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <BriefcaseBusiness size={20} className="text-slate-400" />{" "}
                      Provider Workspace Login
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => openProviderAuth("register")}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-amber-300 dark:text-slate-950"
              >
                <Sparkles size={16} />{" "}
                {typeof t === "function"
                  ? t("becomeProvider")
                  : "Become a Provider"}
              </button>

              <div ref={moreMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                  <Languages size={18} />
                </button>
                {moreMenuOpen && Array.isArray(supportedLanguages) && (
                  <div className="absolute right-0 top-12 z-[75] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang?.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang?.code);
                          setMoreMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-sm font-bold transition ${language === lang?.code ? "bg-blue-50 text-blue-600 dark:bg-white/10 dark:text-white" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}
                      >
                        <span>{lang?.label}</span>
                        {language === lang?.code && (
                          <CheckCircle
                            size={14}
                            className="text-blue-600 dark:text-white"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MOBILE HAMBURGER */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm ${isDark ? "border-slate-800 bg-black text-white" : "border-slate-200 bg-white text-slate-950"}`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
          >
            {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-3 top-24 z-40 overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white/96 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/94 sm:inset-x-5"
          >
            <div className="grid gap-1.5 font-black text-slate-600 dark:text-slate-300">
              {Array.isArray(mainNavItems) &&
                mainNavItems.map((item) => {
                  if (!item) return null;
                  const Icon = item.icon || Menu;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        if (item.id === "top") {
                          if (typeof handleHomeNav === "function")
                            handleHomeNav();
                        } else navigateHome(`#${item.id}`);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${typeof isNavActive === "function" && isNavActive(item.id) ? "bg-blue-600 text-white dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 dark:hover:bg-white/5"}`}
                    >
                      <Icon size={18} /> {item.label}
                    </button>
                  );
                })}

              {user?.role === "user" && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    setActiveView("client");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${activeView === "client" ? "bg-blue-600 text-white dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 dark:hover:bg-white/5"}`}
                >
                  <CalendarCheck size={18} />{" "}
                  {typeof t === "function" ? t("dashboard") : "Dashboard"}
                </button>
              )}
              {user?.role === "provider" && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    loadProviderDashboard();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${["provider", "client"].includes(activeView) ? "bg-blue-600 text-white dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 dark:hover:bg-white/5"}`}
                >
                  <BriefcaseBusiness size={18} /> {providerDashboardNavLabel}
                </button>
              )}
              {user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    loadAdminDashboard();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${activeView === "admin" ? "bg-blue-600 text-white dark:bg-amber-300 dark:text-slate-950" : "hover:bg-slate-100 dark:hover:bg-white/5"}`}
                >
                  <ShieldCheck size={18} />{" "}
                  {typeof t === "function" ? t("admin") : "Admin"}
                </button>
              )}

              {user ? (
                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {" "}
                    Account Settings{" "}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      openProfileMenu();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    <UserRoundCheck size={18} /> My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <ArrowRight size={18} />{" "}
                    {typeof t === "function" ? t("logout") : "Logout"}
                  </button>
                </div>
              ) : (
                <div className="mt-3 grid gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      openClientAuth("login");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-slate-800 dark:border-white/10 dark:text-white"
                  >
                    <UserRoundCheck size={17} /> Client Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      openProviderAuth("login");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-slate-800 dark:border-white/10 dark:text-white"
                  >
                    <BriefcaseBusiness size={17} /> Provider Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      openProviderAuth("register");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-white"
                  >
                    <Sparkles size={16} />{" "}
                    {typeof t === "function"
                      ? t("becomeProvider")
                      : "Become a Provider"}
                  </button>
                </div>
              )}

              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
                <div className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Languages size={13} /> Select Language
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 p-1">
                  {Array.isArray(supportedLanguages) &&
                    supportedLanguages.map((lang) => (
                      <button
                        key={lang?.code}
                        type="button"
                        onClick={() => setLanguage(lang?.code)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${language === lang?.code ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400"}`}
                      >
                        {lang?.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default ModernNavbar;
