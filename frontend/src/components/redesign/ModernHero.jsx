import React from "react";
import { Search, MapPin } from "lucide-react";

export default function ModernHero({ searchTerm, setSearchTerm, onSearch }) {
  return (
    <section className="bg-[#f8fafc] pt-24 pb-12">
      {/* 1. Faint Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07] pointer-events-none transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage:
            "url('https://blog.planview.com/wp-content/uploads/2022/05/iStock-1293656833-1024x585.jpg')",
        }}
      />

      {/* 2. Main Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Side: Content & Search Form (With Fade-in-up Animation Effect) */}
          <div className="transition-all duration-700 transform translate-y-0 opacity-100">
            <h1 className="text-6xl font-extrabold leading-tight text-slate-900 transition-all duration-500 hover:tracking-wide">
              Find{" "}
              <span className="text-blue-600 inline-block hover:scale-105 transition-transform duration-300 cursor-default">
                trusted
              </span>{" "}
              local experts for your home.
            </h1>

            <p className="mt-6 text-lg text-slate-600 opacity-90">
              Compare, book, and track trusted local professionals for all your
              home service needs.
            </p>

            {/* Form with hover shadow animation */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typeof onSearch === "function") onSearch();
              }}
              className="mt-10 rounded-2xl bg-white p-3 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                {/* Search Input */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300">
                  <Search
                    size={20}
                    className="text-slate-400 shrink-0 transition-transform duration-300 group-focus-within:scale-110"
                  />
                  <input
                    type="text"
                    value={searchTerm || ""}
                    onChange={(e) => {
                      if (typeof setSearchTerm === "function")
                        setSearchTerm(e.target.value);
                    }}
                    placeholder="Search for a service..."
                    className="h-14 w-full outline-none text-slate-800 bg-transparent"
                  />
                </div>

                {/* Location Input */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300">
                  <MapPin size={20} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter your location"
                    className="h-14 w-full outline-none text-slate-800 bg-transparent"
                  />
                </div>

                {/* Submit Button with Scale & Pulse Animation */}
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-8 h-14 text-white font-semibold hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.97] hover:shadow-md hover:shadow-blue-200 transition-all duration-200 ease-out"
                >
                  Search Services
                </button>
              </div>
            </form>

            {/* Badges with smooth hover pop effect */}
            <div className="mt-8 flex flex-wrap gap-6 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors duration-200 transform hover:translate-x-1">
                ✓ Verified Professionals
              </span>
              <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors duration-200 transform hover:translate-x-1">
                ✓ Upfront Pricing
              </span>
              <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors duration-200 transform hover:translate-x-1">
                ✓ On-Time Service
              </span>
              <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors duration-200 transform hover:translate-x-1">
                ✓ 24/7 Support
              </span>
            </div>
          </div>

          {/* Right Side: Image with Floating & Scale Micro-interaction */}
          <div className="relative justify-self-center lg:justify-self-end w-full max-w-lg lg:max-w-none group">
            <img
              src="https://www.shutterstock.com/image-photo/image-this-style-skilled-trades-260nw-2730120451.jpg"
              alt="Professional workers vector"
              className="w-full object-cover rounded-[32px] shadow-2xl transition-all duration-500 ease-in-out group-hover:scale-[1.02] group-hover:shadow-blue-100/50"
              style={{ height: "450px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
