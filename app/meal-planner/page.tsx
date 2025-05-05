import { Metadata } from "next"
import AIMealPlan from "@/components/ai-meal-plan"

export const metadata: Metadata = {
  title: "AI Meal Planner | MealMitra",
  description: "Get personalized meal plans tailored to your preferences and dietary needs",
}

export default function MealPlannerPage() {
  return (
    <main className="py-12 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            AI Meal Planner
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Create personalized meal plans based on your preferences, dietary needs, and goals
          </p>
        </div>
        
        <div>
          <AIMealPlan />
        </div>
      </div>
    </main>
  )
} 