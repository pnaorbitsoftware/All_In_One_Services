import { BriefcaseBusiness } from "lucide-react";

export default function ModernPopularServices({ openPopularService }) {
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

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Popular Services
            </span>

            <h2 className="mt-5 text-4xl font-extrabold text-slate-900">
              Home services for every need
            </h2>

            <p className="mt-4 text-slate-600">
              Trusted professionals ready to help.
            </p>
          </div>

          <button className="font-semibold text-blue-600">
            View all services →
          </button>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {popular.map((service) => (
            <button
              key={service.title}
              onClick={() => openPopularService(service.title)}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >
              <img
                src={service.image}
                alt={service.title}
                className="h-52 w-full object-cover"
              />

              <div className="p-5">
                <BriefcaseBusiness size={22} className="text-blue-600" />

                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {service.title}
                </h3>

                <p className="mt-2 text-slate-600">{service.note}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 rounded-[32px] border border-slate-200 bg-slate-50 p-10 md:grid-cols-4" >
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">10k+</h3>
            <p className="mt-2 text-slate-600">Happy Customers</p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">4.8★</h3>
            <p className="mt-2 text-slate-600">Average Rating</p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">500+</h3>
            <p className="mt-2 text-slate-600">Verified Experts</p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-blue-600">24/7</h3>
            <p className="mt-2 text-slate-600">Support</p>
          </div>
        </div>
      </div>
    </section>
  );
}
