import { useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import heroImage from "./img/image.jpeg";

const DEFAULT_SERVICES = [
  "AC Repair",
  "Appliance Repair",
  "Carpenter",
  "Cleaning",
  "Electrician",
  "Home Cleaning",
  "Painter",
  "Plumber",
  "Refrigerator Repair",
  "Washing Machine Repair",
];

const DEFAULT_LOCATIONS = [
  "Baramati",
  "Pune",
  "Pimpri",
  "Chinchwad",
  "Akurdi",
  "Nigdi",
  "Wakad",
  "Hinjewadi",
  "Baner",
  "Kothrud",
  "Hadapsar",
  "Magarpatta",
  "Kharadi",
  "Viman Nagar",
  "Katraj",
  "Swargate",
];

export default function ModernHero({
  searchTerm,
  setSearchTerm,
  location,
  setLocation,
  onSearch,
  serviceSuggestions = DEFAULT_SERVICES,
  locationSuggestions = DEFAULT_LOCATIONS,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const filteredServices = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    return serviceSuggestions
      .filter((item) => item?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchTerm, serviceSuggestions]);

  const filteredLocations = useMemo(() => {
    const q = (location || "").toLowerCase().trim();
    return locationSuggestions
      .filter((item) => item?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [location, locationSuggestions]);

  const submitSearch = () => {
    setActiveDropdown(null);
    if (typeof onSearch === "function") onSearch();
  };

  return (
    <section className="relative overflow-visible bg-[#f8fafc] pb-20 pt-24 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {" "}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07] pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage:
            "url('https://blog.planview.com/wp-content/uploads/2022/05/iStock-1293656833-1024x585.jpg')",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="transition-all duration-700 transform translate-y-0 opacity-100">
            <h1 className="text-5xl font-extrabold leading-tight text-slate-900 transition-all duration-500 hover:tracking-wide dark:text-white sm:text-6xl">
              Find{" "}
              <span className="text-blue-600 inline-block hover:scale-105 transition-transform duration-300 cursor-default">
                trusted
              </span>{" "}
              local experts for your home.
            </h1>

            <p className="mt-6 text-lg text-slate-600 opacity-90 dark:text-slate-300">
              Compare, book, and track trusted local professionals for all your
              home service needs.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
              className="relative z-50 mt-10 rounded-2xl border border-slate-100 bg-white p-3 shadow-lg transition-colors duration-300 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"
            >
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[1fr_1fr_auto]">
                <div className="relative">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:focus-within:ring-blue-500/20">
                    <Search size={20} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchTerm || ""}
                      onFocus={() => setActiveDropdown("service")}
                      onChange={(e) => {
                        setActiveDropdown("service");
                        setSearchTerm?.(e.target.value);
                      }}
                      placeholder="Search for a service..."
                      className="h-14 w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                  </div>

                  {activeDropdown === "service" &&
                    filteredServices.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                        {filteredServices.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSearchTerm?.(item);
                              setActiveDropdown(null);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-blue-300"
                          >
                            <Search size={16} className="text-slate-400" />
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:focus-within:ring-blue-500/20">
                    <MapPin size={20} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={location || ""}
                      onFocus={() => setActiveDropdown("location")}
                      onChange={(e) => {
                        setActiveDropdown("location");
                        setLocation?.(e.target.value);
                      }}
                      placeholder="Enter your location"
                      className="h-14 w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                  </div>

                  {activeDropdown === "location" &&
                    filteredLocations.length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-slate-900">
                        {filteredLocations.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setLocation?.(item);
                              setActiveDropdown(null);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-blue-300"
                          >
                            <MapPin size={16} className="text-slate-400" />
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <button
                  type="submit"
                  className="h-14 rounded-xl bg-blue-600 px-8 font-semibold text-white transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 active:scale-[0.97] md:col-span-2 2xl:col-span-1"
                >
                  Search Services
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <span>✓ Verified Professionals</span>
              <span>✓ Upfront Pricing</span>
              <span>✓ On-Time Service</span>
              <span>✓ 24/7 Support</span>
            </div>
          </div>

          <div className="relative justify-self-center lg:justify-self-end w-full max-w-lg lg:max-w-none group">
            <img
              src={heroImage}
              alt="ServiceHub home service professionals"
              className="w-full object-cover rounded-[20px] shadow-2xl transition-all duration-700 ease-in-out group-hover:scale-[1.02] group-hover:shadow-blue-100/50"
              style={{ height: "410px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
