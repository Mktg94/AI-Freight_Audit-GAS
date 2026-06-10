import { useCallback } from "react"
import {
  ArrowRight,
  Upload,
  Zap,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  ChevronRight,
  Menu,
} from "lucide-react"

const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
  <a href={href} className={className} onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', href); window.dispatchEvent(new Event('popstate')); }}>{children}</a>
)

export default function LandingPage() {
  return (
    <div className={`font-sans bg-white min-h-screen`}>
      {/* ── NAVBAR ── */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* LEFT — Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm text-white">F</span>
            </div>
            <span className="font-semibold text-gray-900 text-base">
              FreightAudit
              <span className="text-indigo-600 font-semibold">AI</span>
            </span>
          </Link>

          {/* CENTER — Nav links (hidden on mobile: hidden md:flex gap-8): */}
          <div className="hidden md:flex gap-8">
            <a
              href="#features"
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors duration-150"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors duration-150"
            >
              How it works
            </a>
            <Link
              href="/pricing"
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors duration-150"
            >
              Pricing
            </Link>
          </div>

          {/* RIGHT — CTA buttons (flex items-center gap-3) */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign in
            </Link>

            <Link
              href="/auth/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile menu icon */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-50 rounded-full blur-3xl opacity-70" />
          <div className="absolute top-24 -right-28 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[46rem] h-[26rem] bg-gradient-to-b from-indigo-50/60 via-white to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* HERO text content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className={`font-mono text-[12px] font-semibold tracking-wide text-indigo-700 uppercase`}>
                  Structured Clarity
                </span>
              </div>

              <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.08]">
                Freight invoices, automatically
                <span className="block text-indigo-600">audited for correctness.</span>
              </h1>

              <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed max-w-xl">
                FreightAudit AI catches billing errors across every invoice—before you pay them. AI extraction meets
                contract matching, with audit-ready flags.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-colors duration-150"
                >
                  Start Free Audit
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how"
                  className="border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-semibold text-sm px-4 py-3 rounded-xl inline-flex items-center gap-2 transition-colors duration-150 bg-white hover:bg-indigo-50/30"
                >
                  See How It Works
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className={`font-mono text-[12px] font-semibold text-gray-900 uppercase tracking-wider mt-3`}>Audit-ready</div>
                  <div className="text-sm text-gray-600 mt-1">Clear references & checks</div>
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className={`font-mono text-[12px] font-semibold text-gray-900 uppercase tracking-wider mt-3`}>Minutes</div>
                  <div className="text-sm text-gray-600 mt-1">Fast review workflow</div>
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className={`font-mono text-[12px] font-semibold text-gray-900 uppercase tracking-wider mt-3`}>Saves money</div>
                  <div className="text-sm text-gray-600 mt-1">Reduce overpayments</div>
                </div>
              </div>
            </div>

            {/* ── HERO VISUAL (mock invoice table) ── */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-b from-indigo-50 to-transparent rounded-[2rem] blur-xl opacity-60" />
                <div className="relative bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className={`font-mono text-[12px] font-semibold text-gray-900 uppercase tracking-wider`}>
                          Invoice • FDX-98774
                        </div>
                        <div className="text-sm text-gray-500">Contract checks with audit trail</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className={`font-mono text-[12px] font-semibold text-red-700`}>1 flagged</span>
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                          <tr className={`font-mono text-[11px] uppercase text-gray-500`}>
                            <th className="px-4 py-3 font-semibold">Line item</th>
                            <th className="px-4 py-3 font-semibold">Billed</th>
                            <th className="px-4 py-3 font-semibold">Expected</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              Base Freight Charge
                              <div className={`font-mono text-[11px] text-gray-500 mt-1`}>Verified against contract</div>
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-semibold">$1,240.00</td>
                            <td className="px-4 py-3 text-gray-600">$1,240.00</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className={`font-mono text-[12px] font-semibold text-emerald-700`}>
                                  Verified
                                </span>
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              Fuel Surcharge index %
                              <div className={`font-mono text-[11px] text-red-600 mt-1`}>Rate sheet discrepancy</div>
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-semibold">$385.10</td>
                            <td className="px-4 py-3 text-gray-600">$112.50</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span className={`font-mono text-[12px] font-semibold text-amber-700`}>
                                  Review
                                </span>
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              Residential Delivery Accessory
                              <div className={`font-mono text-[11px] text-gray-500 mt-1`}>Verified against contract</div>
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-semibold">$85.00</td>
                            <td className="px-4 py-3 text-gray-600">$85.00</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className={`font-mono text-[12px] font-semibold text-emerald-700`}>
                                  Verified
                                </span>
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-mono text-[12px] font-semibold text-gray-900 uppercase tracking-wider`}>
                            Net audited difference
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Flagged amount with references</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-[12px] font-semibold uppercase tracking-wider text-gray-500`}>
                          Disputed
                        </div>
                        <div className="text-lg font-bold text-red-600 leading-none mt-1">-$272.60</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS BAR ── */}
          <div className="mt-12 border border-gray-100 rounded-[1.25rem] bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="px-6 py-6 text-center">
                <div className="text-4xl font-extrabold tracking-tight text-indigo-600">$2.4B+</div>
                <div className={`font-mono text-[12px] uppercase tracking-wider font-semibold text-gray-500 mt-3`}>
                  Industry overcharges annually
                </div>
              </div>
              <div className="px-6 py-6 border-t md:border-t-0 md:border-l border-gray-100 text-center">
                <div className="text-4xl font-extrabold tracking-tight text-indigo-600">15–25%</div>
                <div className={`font-mono text-[12px] uppercase tracking-wider font-semibold text-gray-500 mt-3`}>
                  Average invoice error rate
                </div>
              </div>
              <div className="px-6 py-6 border-t md:border-t-0 md:border-l border-gray-100 text-center">
                <div className="text-4xl font-extrabold tracking-tight text-indigo-600">$13.11</div>
                <div className={`font-mono text-[12px] uppercase tracking-wider font-semibold text-gray-500 mt-3`}>
                  Cost to manually process one invoice
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Audit Intelligence in Action</h2>
          <p className={`font-mono text-[12px] uppercase tracking-widest font-semibold text-indigo-600`}>
            three seamless steps to automate invoice audits
          </p>
        </div>

        <div className="mt-12 relative">
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-px bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white border border-gray-100 rounded-2xl p-7 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
                <span className={`font-mono text-sm font-bold text-indigo-700`}>1</span>
              </div>
              <div className="mt-4 w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-700">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-sm font-bold text-gray-900">Upload Your Invoice</h3>
              <p className="mt-2 text-sm text-gray-600">Drop PDF invoices via our secure portal.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-7 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
                <span className={`font-mono text-sm font-bold text-indigo-700`}>2</span>
              </div>
              <div className="mt-4 w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-700">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-sm font-bold text-gray-900">AI Audits in Minutes</h3>
              <p className="mt-2 text-sm text-gray-600">Compares every line item against your contracts.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-7 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
                <span className={`font-mono text-sm font-bold text-indigo-700`}>3</span>
              </div>
              <div className="mt-4 w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-700">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-sm font-bold text-gray-900">Catch Overcharges</h3>
              <p className="mt-2 text-sm text-gray-600">Review flags and generate disputes instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">What FreightAudit AI Does</h2>
            <p className={`font-mono text-[12px] uppercase tracking-widest font-semibold text-indigo-600`}>
              Enterprise grade tools crafted for logistic billing integrity
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-7 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-gray-900">Smart Extraction</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                AI reads any invoice format, any carrier—no standard templates, regex rules, or rigid mapping schedules required.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-7 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-gray-900">Contract Matching</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Every charge verified against your active carrier rate agreements. We check base freights, accessorial fees, weight steps, and fuel scale models.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-7 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-gray-900">Dispute Automation</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                One-click dispute letters generated dynamically with exact references. Sent in seconds to bypass lengthy back-and-forth arguments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-gradient-to-r from-indigo-950 to-indigo-900 border-t border-indigo-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-[2rem] bg-white/5 border border-white/10 px-6 md:px-10 py-10 md:py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight uppercase">Ready to stop the leakage?</h2>
            <p className="mt-3 text-indigo-100/90 text-sm md:text-base max-w-2xl mx-auto">
              Join logistics teams already saving thousands of dollars per month by catching carrier billing errors early.
            </p>

            <div className="mt-8 flex items-center justify-center">
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-10 py-4 rounded-xl transition-colors duration-150 inline-flex items-center gap-2"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-gray-900 text-sm">FreightAudit AI</span>
            </div>
            <p className={`font-mono text-[11px] text-gray-500`}>&copy; 2025 FreightAudit AI. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-gray-500 font-semibold text-[12px]">
            <a href="#" className="hover:text-gray-900 transition-colors duration-150">Privacy Policy</a>
            <span className="text-gray-300">•</span>
            <a href="#" className="hover:text-gray-900 transition-colors duration-150">Terms of Service</a>
            <span className="text-gray-300">•</span>
            <a href="#features" className="hover:text-indigo-600 transition-colors duration-150">Features</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

