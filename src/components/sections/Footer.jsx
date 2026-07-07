import React from "react"

const productLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Templates", href: "#" },
]

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
]

const socialLinks = [
  { label: "Twitter", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Discord", href: "#" },
]

export const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 pt-20 pb-12">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
          {/* Left — Logo & tagline */}
          <div className="md:col-span-1">
            <div className="font-display text-xl text-primary-foreground">
              ✦ Nexora
            </div>
            <p className="mt-3 text-sm text-primary-foreground/60 font-body leading-relaxed">
              Premium AI Website Prompts
            </p>
          </div>

          {/* Center — Link columns */}
          <div className="md:col-span-1 grid grid-cols-2 gap-8">
            {/* Product */}
            <div>
              <h4 className="text-sm font-medium text-primary-foreground/40 uppercase tracking-widest font-body mb-5">
                Product
              </h4>
              <ul className="space-y-3">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm font-body"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-medium text-primary-foreground/40 uppercase tracking-widest font-body mb-5">
                Company
              </h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm font-body"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Social links */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-medium text-primary-foreground/40 uppercase tracking-widest font-body mb-5">
              Connect
            </h4>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm font-body"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-16 pt-8">
          <p className="text-center text-sm text-primary-foreground/40 font-body">
            © 2025 Flowsites. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
