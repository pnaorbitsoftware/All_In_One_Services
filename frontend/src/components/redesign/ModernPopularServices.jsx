import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness } from "lucide-react";

export default function ModernPopularServices({
  openPopularService,
}) {
  const [paused, setPaused] = useState(false);
  const sliderRef = useRef(null);

  const popular = [
    {
      title: "AC Repair",
      note: "Cleaning, gas refill, installation",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Wall_mount_air_conditioner.jpg/960px-Wall_mount_air_conditioner.jpg",
    },
    {
      title: "Plumber",
      note: "Leaks, fittings, emergency repairs",
      image:
        "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=640&q=80",
    },
    {
      title: "Electrician",
      note: "Wiring, fixtures, safety checks",
      image:
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80",
    },
    {
      title: "Appliance Repair",
      note: "Fridge, TV, washing machine",
      image:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&q=80",
    },
    {
      title: "Carpentry",
      note: "Furniture, doors, modular fittings",
      image:
        "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=640&q=80",
    },
  ];

useEffect(() => {
  if (paused) return;

  const slider = sliderRef.current;

  const interval = setInterval(() => {
    if (!slider) return;

    slider.scrollLeft += 4;

    if (
      slider.scrollLeft >=
      slider.scrollWidth - slider.clientWidth
    ) {
      slider.scrollLeft = 0;
    }
  }, 10);

  return () => clearInterval(interval);
}, [paused]);
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative overflow-hidden bg-slate-50 py-20"
    >
      {/* Background Blur Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-100 blur-3xl opacity-50" />

        <div className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-indigo-100 blur-3xl opacity-50" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Popular Services
            </span>

            <h2 className="mt-5 text-4xl font-extrabold text-slate-900 md:text-5xl">
              Home services for every need
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Trusted professionals ready to help.
            </p>
          </div>

          <button className="font-semibold text-blue-600 transition hover:text-blue-700">
            View all services →
          </button>
        </div>

        {/* Auto Slider */}
        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {[...popular, ...popular].map((service, index) => (
            <motion.button
              key={index}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused(true)}
              onTouchEnd={() => setPaused(false)}
              onClick={() =>
                openPopularService(service.title)
              }
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="
                group
                min-w-[300px]
                overflow-hidden
                rounded-[28px]
                border
                border-slate-200
                bg-white
                text-left
                shadow-sm
                transition-all
                duration-300
                hover:border-blue-200
                hover:shadow-2xl
              "
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="
                    h-full
                    w-full
                    object-cover
                    transition-all
                    duration-700
                    group-hover:scale-110
                    group-hover:brightness-105
                  "
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5">
                <BriefcaseBusiness
                  size={22}
                  className="text-blue-600"
                />

                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {service.title}
                </h3>

                <p className="mt-2 text-slate-600">
                  {service.note}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-14 grid grid-cols-2 gap-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-4">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">
              10K+
            </h3>
            <p className="mt-2 text-slate-600">
              Happy Customers
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">
              4.8★
            </h3>
            <p className="mt-2 text-slate-600">
              Average Rating
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">
              500+
            </h3>
            <p className="mt-2 text-slate-600">
              Verified Experts
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">
              24/7
            </h3>
            <p className="mt-2 text-slate-600">
              Support
            </p>
          </div>
        </div>
      </div>

      {/* Hide Scrollbar */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </motion.section>
  );
}