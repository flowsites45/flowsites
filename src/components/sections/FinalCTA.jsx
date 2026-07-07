import React from "react"
import { SectionReveal, RevealItem } from "../SectionReveal"
import { Button } from "../../components/ui/button"

export const FinalCTA = () => {
  return (
    <section className="paper-texture bg-warm-white relative overflow-hidden py-32 md:py-40 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto relative z-10">
        <SectionReveal className="text-center">
          <RevealItem>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight text-foreground">
              Ready to Design Like a Pro?
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed">
              Join thousands of designers and developers building beautiful websites with AI.
            </p>
          </RevealItem>
          <RevealItem>
            <div className="mt-10">
              <Button
                className="rounded-full px-8 py-4 text-base font-medium bg-gradient-to-b from-primary to-primary/90 text-primary-foreground border border-primary-foreground/20 border-t-primary-foreground/40 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-colors duration-300 hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3)]"
              >
                Get Started
              </Button>
            </div>
          </RevealItem>
        </SectionReveal>
      </div>
    </section>
  )
}
