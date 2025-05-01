"use client"

import type React from "react"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import HowItWorks from "@/components/how-it-works"
import PersonalizationOptions from "@/components/personalization-options"
import SampleMeals from "@/components/sample-meals"
import Testimonials from "@/components/testimonials"
import CtaSection from "@/components/cta-section"
import Footer from "@/components/footer"
import MealPlanBuilder from "@/components/meal-plan-builder"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <main>
        <HeroSection />

        <AnimatedSection>
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Create Your Meal Plan</h2>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                  Tell us about your goals and preferences to get a personalized Indian meal plan
                </p>
              </div>
              <div className="mt-12" id="create-meal-plan">
                <MealPlanBuilder />
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <FeaturesSection />
        </AnimatedSection>

        <AnimatedSection>
          <HowItWorks />
        </AnimatedSection>

        <AnimatedSection>
          <PersonalizationOptions />
        </AnimatedSection>

        <AnimatedSection>
          <SampleMeals />
        </AnimatedSection>

        <AnimatedSection>
          <Testimonials />
        </AnimatedSection>

        <AnimatedSection>
          <CtaSection />
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  )
}

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        hidden: { opacity: 0, y: 50 },
      }}
    >
      {children}
    </motion.div>
  )
}
