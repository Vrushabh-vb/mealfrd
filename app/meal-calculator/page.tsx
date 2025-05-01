import { Metadata } from "next"
import MealCalculator from "@/components/meal-calculator"

export const metadata: Metadata = {
  title: "Meal Calculator | MealMitra",
  description: "Calculate nutrition information for your custom meals",
}

export default function MealCalculatorPage() {
  return (
    <main className="py-12 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Meal Calculator
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Create custom meals and calculate nutritional information
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <MealCalculator />
        </div>
      </div>
    </main>
  )
} 