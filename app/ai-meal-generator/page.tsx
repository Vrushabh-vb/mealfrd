import { Metadata } from "next"
import AIMealSuggestion from "@/components/ai-meal-suggestion"

export const metadata: Metadata = {
  title: "AI Meal Generator | MealMitra",
  description: "Get personalized meal suggestions using our AI",
}

export default function AIMealGeneratorPage() {
  return (
    <main className="py-12 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            AI Meal Generator
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Let our AI create personalized recipes based on ingredients you have
          </p>
        </div>
        
        <div>
          <AIMealSuggestion />
        </div>
      </div>
    </main>
  )
} 