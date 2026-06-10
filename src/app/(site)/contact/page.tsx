import type { Metadata } from "next";
import { Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getContactContent } from "@/lib/site-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Ayesha-Sharif Publication."
};

export default async function ContactPage() {
  const c = await getContactContent();

  const contacts = [
    { icon: Phone,         label: "Phone",    value: c.phone },
    { icon: MessageCircle, label: "WhatsApp", value: c.whatsapp },
    { icon: Mail,          label: "Email",    value: c.email },
    { icon: Facebook,      label: "Facebook", value: c.facebookText },
    { icon: MapPin,        label: "Office",   value: c.address },
  ];

  return (
    <div className="container-px mx-auto max-w-6xl py-10">
      <div className="mb-7">
        <h1 className="font-serif text-3xl font-normal text-forest">{c.pageTitle}</h1>
        <p className="mt-2 text-sm text-gray-soft">{c.pageSubtitle}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="flex gap-3 rounded-lg border border-line bg-white p-4"
            >
              <item.icon className="mt-1 h-5 w-5 shrink-0 text-sage" aria-hidden="true" />
              <div>
                <p className="font-medium text-forest">{item.label}</p>
                <p className="mt-1 text-sm text-gray-soft">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="glass-card grid gap-4 rounded-[10px] p-5">
          <label>
            <span className="form-label">Name</span>
            <input className="form-input mt-1" />
          </label>
          <label>
            <span className="form-label">Phone or email</span>
            <input className="form-input mt-1" />
          </label>
          <label>
            <span className="form-label">Message</span>
            <textarea rows={5} className="form-input mt-1" />
          </label>
          <button
            type="button"
            className="focus-ring min-h-12 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-forest"
          >
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
