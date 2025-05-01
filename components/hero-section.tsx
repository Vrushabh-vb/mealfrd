"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
            >
              <span className="block">Personalized Indian</span>
              <span className="block text-green-600">Meal Plans</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl"
            >
              Based on Your Fitness Goals, Health Needs, and Budget!
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 text-base text-gray-700 sm:mt-5 sm:text-lg"
            >
              Eat smart. Stay fit. Enjoy Indian flavors. Our AI creates your perfect Indian meal plan — customized to
              your fitness goals, allergies, and monthly budget.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Upload Current Diet
                </Button>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
          >
            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                <div className="w-full h-[400px] bg-gradient-to-br from-green-100 to-green-200 rounded-lg overflow-hidden relative">
                  <div className="absolute inset-0 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Healthy Indian Meals</h3>
                    <p className="text-gray-700 mb-4">Balanced nutrition with authentic flavors</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm font-medium text-green-600">Breakfast</p>
                        <p className="text-xs text-gray-500">Masala Dosa</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm font-medium text-green-600">Lunch</p>
                        <p className="text-xs text-gray-500">Rajma Chawal</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm font-medium text-green-600">Dinner</p>
                        <p className="text-xs text-gray-500">Paneer Tikka</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm font-medium text-green-600">Snack</p>
                        <p className="text-xs text-gray-500">Sprouts Chaat</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black opacity-10 rounded-lg"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
