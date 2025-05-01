"use client"

import { motion } from "framer-motion"
import { Utensils, Brain, Leaf, ShoppingBag, DollarSign, RefreshCw, BarChart, Smartphone } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: <Utensils className="h-8 w-8 text-green-500" />,
      title: "Indian Food Database",
      description: "Hundreds of authentic Indian recipes to choose from",
    },
    {
      icon: <Brain className="h-8 w-8 text-green-500" />,
      title: "AI-Powered Personalization",
      description: "Meal plans tailored to your specific needs and preferences",
    },
    {
      icon: <Leaf className="h-8 w-8 text-green-500" />,
      title: "Veg and Non-Veg Options",
      description: "Comprehensive meal choices for all dietary preferences",
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-green-500" />,
      title: "Automated Grocery List",
      description: "Get a complete list of Indian ingredients you'll need",
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      title: "Budget-Friendly Choices",
      description: "Plans starting from ₹100 per day with local ingredients",
    },
    {
      icon: <RefreshCw className="h-8 w-8 text-green-500" />,
      title: "Easy Meal Swaps",
      description: "Flexibility to change dishes based on your preferences",
    },
    {
      icon: <BarChart className="h-8 w-8 text-green-500" />,
      title: "Macro and Calorie Tracking",
      description: "Monitor your nutrition with detailed breakdowns",
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-500" />,
      title: "Works on Mobile",
      description: "Access your meal plans anywhere, anytime",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Features</h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Everything you need for your perfect Indian meal plan
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div key={index} variants={item} className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full hover:shadow-md transition-shadow duration-300">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-100 rounded-md shadow-lg">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
