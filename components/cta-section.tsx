"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-green-500 to-green-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-white sm:text-4xl"
          >
            Ready to Start Your Fitness Journey the Indian Way?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl text-xl text-green-100 mx-auto"
          >
            Get your personalized meal plan today and transform your health with delicious Indian food.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50"
                onClick={() => {
                  // Scroll to the meal plan builder section
                  const element = document.getElementById('create-meal-plan');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Create My Meal Plan
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <h3 className="text-xl font-bold text-white flex items-center justify-center">
              <Gift className="h-6 w-6 mr-2" /> Bonus Features
            </h3>
            <ul className="mt-4 space-y-2 text-green-100">
              <li>New Indian healthy recipes added every week</li>
              <li>Special festive meal adjustments (e.g., Navratri, Ramadan, Diwali)</li>
              <li>Personalized shopping lists for local Indian markets</li>
              <li>24/7 nutritionist support for your questions</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
