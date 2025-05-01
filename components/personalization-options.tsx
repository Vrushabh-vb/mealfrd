import { Activity, AlertTriangle, DollarSign, Coffee, Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PersonalizationOptions() {
  const options = [
    {
      icon: <Activity className="h-8 w-8 text-green-600" />,
      title: "Fitness Goals We Cover",
      items: [
        "Weight Loss (Fat loss with healthy Indian options)",
        "Muscle Gain (High-protein Indian meals)",
        "Healthy Lifestyle Maintenance",
        "Strength and Endurance Training (Athlete-focused plans)",
      ],
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-green-600" />,
      title: "Dietary Needs & Allergies",
      items: ["Lactose-Free", "Nut-Free", "Gluten-Free", "Jain", "Vegan", "Vegetarian", "Non-Vegetarian"],
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "Budget-Friendly Plans",
      items: [
        "Meal plans starting from ₹100 per day",
        "Mid-range healthy options",
        "Premium healthy diets",
        "Cost-effective ingredient substitutions",
      ],
    },
    {
      icon: <Coffee className="h-8 w-8 text-green-600" />,
      title: "Meal Preferences",
      items: ["North Indian", "South Indian", "Low-Oil Cooking", "Quick Recipes", "Traditional Foods"],
    },
    {
      icon: <Calculator className="h-8 w-8 text-green-600" />,
      title: "Calorie & Macro Calculation",
      items: [
        "Auto-calculated based on your height",
        "Weight, gender, age considerations",
        "Activity level adjustments",
        "All in Indian food context",
      ],
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Personalization Options</h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Customize your meal plan to fit your exact needs
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {options.map((option, index) => (
            <Card key={index} className="border-green-100">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {option.icon}
                <CardTitle className="text-xl">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {option.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center">
                      <div className="mr-2 h-2 w-2 rounded-full bg-green-600"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
