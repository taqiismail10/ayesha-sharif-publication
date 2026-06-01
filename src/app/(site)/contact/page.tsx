import type { Metadata } from "next";
import { Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { defaultContact } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Ayesha-Sharif Publication."
};

export default function ContactPage() {
  const contacts = [
    { icon: Phone, label: "Phone", value: defaultContact.phone },
    { icon: MessageCircle, label: "WhatsApp", value: defaultContact.whatsapp },
    { icon: Mail, label: "Email", value: defaultContact.email },
    { icon: Facebook, label: "Facebook", value: "Facebook page placeholder" },
    { icon: MapPin, label: "Office", value: defaultContact.address }
  ];

  return (
    <div className="container-px mx-auto max-w-6xl py-10">
      <div className="mb-7">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Contact</h1>
        <p className="mt-2 text-sm text-muted">
          Reach out for book orders, wholesale questions, or publication updates.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="flex gap-3 rounded-lg border border-line bg-white p-4"
            >
              <item.icon className="mt-1 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <p className="font-extrabold text-navy">{item.label}</p>
                <p className="mt-1 text-sm text-muted">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-sm">
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
            className="focus-ring min-h-12 rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white"
          >
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
