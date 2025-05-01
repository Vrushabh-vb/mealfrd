"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Calculator, Sparkles } from "lucide-react"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-green-600">MealMitra</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="#features"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              How It Works
            </Link>
            <Link href="#meals" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Sample Meals
            </Link>
            <Link
              href="#testimonials"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Testimonials
            </Link>
            <Link
              href="/meal-calculator"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <Calculator className="h-4 w-4 mr-1" />
              Meal Calculator
            </Link>
            <Link
              href="/ai-meal-generator"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Recipe Generator
            </Link>
            <Button className="ml-4 bg-green-600 hover:bg-green-700">Get Started</Button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
            <Link
              href="#features"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#meals"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Sample Meals
            </Link>
            <Link
              href="#testimonials"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="/meal-calculator"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Meal Calculator
            </Link>
            <Link
              href="/ai-meal-generator"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Recipe Generator
            </Link>
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
