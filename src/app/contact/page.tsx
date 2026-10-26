"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, Sparkles, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "ORDER_STATUS",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="bg-[#F6F0E5] min-h-screen text-[#123D30]">
      {/* Header */}
      <section className="bg-[#173D2C] text-[#F6F0E5] py-16 px-4 sm:px-6 lg:px-8 text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4D3E] border border-[#B99553]/40 text-[#D4B679] text-xs uppercase font-bold tracking-widest">
          <MessageSquare className="w-3.5 h-3.5" />
          Customer Concierge
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF7F0]">
          Contact &amp; Assistance
        </h1>
        <p className="text-xs sm:text-sm text-[#ECE2D0]/85 max-w-xl mx-auto leading-relaxed">
          Have an inquiry about an order, wholesale bulk purchasing, or bespoke wedding gift boxes? Our concierge team is at your service.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/90 backdrop-blur-xs p-8 rounded-3xl border border-[#D7C8AF] shadow-md space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C6D37]">
                Direct Contacts
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#123D30]">
                We Are Here to Assist
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30] shrink-0">
                    <Phone className="w-4 h-4 text-[#8C6D37]" />
                  </div>
                  <div>
                    <span className="block font-bold text-[#123D30]">Telephone Concierge</span>
                    <a href="tel:+918368301495" className="text-[#4E6258] hover:text-[#8C6D37] block font-medium">
                      +91-8368301495
                    </a>
                    <a href="tel:+917633080180" className="text-[#4E6258] hover:text-[#8C6D37] block font-medium">
                      +91-7633080180
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30] shrink-0">
                    <Mail className="w-4 h-4 text-[#8C6D37]" />
                  </div>
                  <div>
                    <span className="block font-bold text-[#123D30]">Official Email</span>
                    <a href="mailto:customersupport@fruitsandnuts.co.in" className="text-[#4E6258] hover:text-[#8C6D37] font-medium break-all">
                      customersupport@fruitsandnuts.co.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30] shrink-0">
                    <Clock className="w-4 h-4 text-[#8C6D37]" />
                  </div>
                  <div>
                    <span className="block font-bold text-[#123D30]">Support Hours</span>
                    <span className="text-[#4E6258] block">Monday – Saturday: 10:00 AM – 8:00 PM IST</span>
                    <span className="text-[#4E6258] block">Sunday: 11:00 AM – 6:00 PM IST</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EFE8DC] flex items-center justify-center text-[#123D30] shrink-0">
                    <MapPin className="w-4 h-4 text-[#8C6D37]" />
                  </div>
                  <div>
                    <span className="block font-bold text-[#123D30]">Registered Office</span>
                    <p className="text-[#4E6258] leading-relaxed">
                      K-14 Sapphire 90 Mall, Sector 90, Gurgaon, Haryana — 122505
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D7C8AF]">
                <Link
                  href="/stores"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123D30] hover:text-[#8C6D37] transition-colors"
                >
                  View All Flagship Boutiques &amp; Tasting Lounges &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white/90 backdrop-blur-xs p-8 sm:p-10 rounded-3xl border border-[#D7C8AF] shadow-md space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C6D37]">
                Direct Message
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#123D30]">
                Send an Inquiry
              </h2>

              {submitted ? (
                <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#D7C8AF] space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#123D30] mx-auto" />
                  <h3 className="font-serif text-xl font-bold text-[#123D30]">Inquiry Received</h3>
                  <p className="text-xs text-[#4E6258] max-w-md mx-auto">
                    Thank you, <strong>{form.name}</strong>. A dedicated concierge specialist will review your note and respond within 24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", inquiryType: "ORDER_STATUS", message: "" });
                    }}
                    className="mt-4 px-6 py-2.5 bg-[#123D30] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#0B261E] transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#123D30] block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#D7C8AF] rounded-xl focus:outline-none focus:border-[#123D30] text-[#123D30]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#123D30] block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#D7C8AF] rounded-xl focus:outline-none focus:border-[#123D30] text-[#123D30]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#123D30] block mb-1">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#D7C8AF] rounded-xl focus:outline-none focus:border-[#123D30] text-[#123D30]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#123D30] block mb-1">
                        Inquiry Topic *
                      </label>
                      <select
                        value={form.inquiryType}
                        onChange={(e) => setForm({ ...form, inquiryType: e.target.value })}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#D7C8AF] rounded-xl focus:outline-none focus:border-[#123D30] text-[#123D30]"
                      >
                        <option value="ORDER_STATUS">Order Status &amp; Tracking</option>
                        <option value="CORPORATE_GIFTING">Corporate &amp; Festive Hampers</option>
                        <option value="WEDDING_GIFTING">Wedding Favors &amp; Calligraphy Boxes</option>
                        <option value="WHOLESALE_ENQUIRY">Wholesale / Per-Kg Bulk Rates</option>
                        <option value="GENERAL_FEEDBACK">Product Feedback / Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#123D30] block mb-1">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please share your inquiry details, delivery deadline, or requested item specifications..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F0] border border-[#D7C8AF] rounded-xl focus:outline-none focus:border-[#123D30] text-[#123D30]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#123D30] text-[#FAF7F0] text-xs font-bold uppercase tracking-wider hover:bg-[#0B261E] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Submitting..." : "Send Message"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
