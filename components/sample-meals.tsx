"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Utensils } from "lucide-react"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"

export default function SampleMeals() {
  const [hoveredMeal, setHoveredMeal] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }))
  }

  const mealCategories = [
    {
      id: "breakfast",
      title: "Breakfast",
      meals: [
        {
          name: "Moong Dal Chilla",
          description: "Protein-rich savory pancakes made with yellow moong dal, spices, and vegetables.",
          calories: "220 kcal",
          protein: "12g",
          carbs: "30g",
          fat: "6g",
          image: "/Moong_Dal_Chilla.png",
        },
        {
          name: "Masala Oats",
          description: "Savory oatmeal cooked with vegetables and Indian spices for a healthy start.",
          calories: "180 kcal",
          protein: "8g",
          carbs: "28g",
          fat: "4g",
          image: "/Masala_Oats.png",
        },
        {
          name: "Sprouts Salad",
          description: "Mixed sprouts with tomatoes, cucumber, and a tangy lemon dressing.",
          calories: "150 kcal",
          protein: "9g",
          carbs: "20g",
          fat: "3g",
          image: "/Sprouts_Salad.png",
        },
      ],
    },
    {
      id: "lunch",
      title: "Lunch",
      meals: [
        {
          name: "Rajma Chawal",
          description: "Protein-rich kidney beans curry served with steamed rice.",
          calories: "340 kcal",
          protein: "15g",
          carbs: "55g",
          fat: "8g",
          image: "/Rajma_Chawal.png",
        },
        {
          name: "Quinoa Khichdi",
          description: "A modern twist on the traditional khichdi using quinoa instead of rice.",
          calories: "290 kcal",
          protein: "12g",
          carbs: "45g",
          fat: "7g",
          image: "/Quinoa_Khichdi.png",
        },
        {
          name: "Grilled Paneer Tikka",
          description: "Marinated and grilled cottage cheese with vegetables and mint chutney.",
          calories: "320 kcal",
          protein: "18g",
          carbs: "12g",
          fat: "22g",
          image: "/Grilled_Paneer_Tikka.png",
        },
      ],
    },
    {
      id: "dinner",
      title: "Dinner",
      meals: [
        {
          name: "Tandoori Chicken",
          description: "Marinated chicken cooked in tandoor style with minimal oil.",
          calories: "280 kcal",
          protein: "32g",
          carbs: "5g",
          fat: "14g",
          image: "/placeholder.jpg",
        },
        {
          name: "Vegetable Stir-Fry",
          description: "Mixed vegetables stir-fried with minimal oil and Indian spices.",
          calories: "180 kcal",
          protein: "6g",
          carbs: "22g",
          fat: "8g",
          image: "/placeholder.jpg",
        },
        {
          name: "Dal Tadka",
          description: "Yellow lentils tempered with cumin, garlic, and spices.",
          calories: "260 kcal",
          protein: "14g",
          carbs: "40g",
          fat: "7g",
          image: "/placeholder.jpg",
        },
      ],
    },
    {
      id: "snacks",
      title: "Snacks",
      meals: [
        {
          name: "Roasted Makhana",
          description: "Fox nuts roasted with minimal oil and spices for a crunchy snack.",
          calories: "120 kcal",
          protein: "4g",
          carbs: "18g",
          fat: "3g",
          image: "/placeholder.jpg",
        },
        {
          name: "Boiled Chana",
          description: "Protein-rich boiled chickpeas seasoned with lemon and spices.",
          calories: "130 kcal",
          protein: "7g",
          carbs: "22g",
          fat: "2g",
          image: "/placeholder.jpg",
        },
        {
          name: "Idli Sambar",
          description: "Steamed rice cakes served with lentil vegetable stew.",
          calories: "180 kcal",
          protein: "6g",
          carbs: "30g",
          fat: "3g",
          image: "/placeholder.jpg",
        },
      ],
    },
  ]

  return (
    <section id="meals" className="py-16 bg-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Sample Dishes Our AI Can Suggest</h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Delicious, nutritious Indian meals tailored to your goals
          </p>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="breakfast" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              {mealCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  {category.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {mealCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.meals.map((meal, index) => {
                    const mealId = `${category.id}-${index}`
                    return (
                      <CardContainer key={index} className="h-full w-full">
                        <CardBody className="h-full bg-white border-green-100 p-0 overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                          <CardItem 
                            translateZ="100" 
                            className="mt-4 mx-4 text-xl font-bold text-green-700"
                          >
                            {meal.name}
                          </CardItem>
                          <CardItem 
                            translateZ="80" 
                            className="mx-4 mt-2 text-gray-600 text-sm"
                          >
                            {meal.description}
                          </CardItem>
                          <CardItem 
                            translateZ="140" 
                            className="w-full mt-4 aspect-video relative"
                          >
                            {imageErrors[mealId] ? (
                              <div className="w-full h-full bg-gradient-to-r from-green-100 to-green-200 flex items-center justify-center rounded-xl">
                                <div className="text-center">
                                  <Utensils className="h-12 w-12 text-green-600 mx-auto mb-2" />
                                  <p className="text-green-700 font-medium">{meal.name}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full relative rounded-xl overflow-hidden">
                                <Image
                                  src={meal.image}
                                  alt={meal.name}
                                  fill
                                  className="object-cover"
                                  onError={() => handleImageError(mealId)}
                                />
                              </div>
                            )}
                          </CardItem>
                          <CardItem translateZ="60" className="mx-4 mt-6">
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div className="text-center">
                                <p className="font-medium text-green-600">{meal.calories}</p>
                                <p className="text-gray-500">Calories</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-green-600">{meal.protein}</p>
                                <p className="text-gray-500">Protein</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-green-600">{meal.carbs}</p>
                                <p className="text-gray-500">Carbs</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-green-600">{meal.fat}</p>
                                <p className="text-gray-500">Fat</p>
                              </div>
                            </div>
                          </CardItem>
                        </CardBody>
                      </CardContainer>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  )
}
