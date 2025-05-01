import { UserCircle, Brain, ShoppingBag, BarChart } from "lucide-react"
import Image from "next/image"

export default function HowItWorks() {
  const steps = [
    {
      icon: <UserCircle className="h-12 w-12 text-green-600" />,
      title: "Tell Us About Yourself",
      description: 'Select your goal (e.g., "Lose 5 kg", "Build Muscle"), allergies, preferences, and budget.',
    },
    {
      icon: <Brain className="h-12 w-12 text-green-600" />,
      title: "AI Designs Your Indian Meal Plan",
      description:
        "Get daily breakfast, lunch, dinner, and snacks — including dishes like Poha, Paneer Bhurji, Dal Tadka, Grilled Chicken Tikka, and more.",
    },
    {
      icon: <ShoppingBag className="h-12 w-12 text-green-600" />,
      title: "Get Grocery List & Recipes",
      description: "Receive a full weekly grocery list with Indian ingredients (e.g., atta, dal, masalas).",
    },
    {
      icon: <BarChart className="h-12 w-12 text-green-600" />,
      title: "Track Progress & Swap Meals",
      description: 'Swap dishes (e.g., replace "Aloo Paratha" with "Oats Upma") based on taste or calorie needs.',
    },
  ]

  return (
    <section id="how-it-works" className="py-16 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">How It Works</h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Four simple steps to your personalized Indian meal plan
          </p>
        </div>

        <div className="mt-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg shadow-xl w-full h-[600px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                    <Brain className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI Meal Planning</h3>
                  <p className="text-gray-600">Our intelligent system creates a personalized Indian meal plan that matches your goals and preferences</p>
                </div>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <dl className="space-y-10">
                {steps.map((step, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-16 w-16 rounded-md bg-white shadow-md">
                        {step.icon}
                      </div>
                    </div>
                    <div className="ml-4">
                      <dt className="text-lg leading-6 font-medium text-gray-900">{step.title}</dt>
                      <dd className="mt-2 text-base text-gray-500">{step.description}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
