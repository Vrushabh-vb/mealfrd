"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Loader2, Plus, X, Cpu, Calendar, Clock, Download, RotateCw } from "lucide-react"
import { suggestMealPlan } from "@/lib/lm-studio"
import { jsPDF } from "jspdf"
import 'jspdf-autotable'

// Common cuisines available
const cuisineOptions = [
  "Indian",
  "North Indian",
  "South Indian",
  "Italian",
  "Chinese",
  "Mediterranean",
  "Mexican",
  "Japanese",
  "Thai",
  "Continental"
]

// Common allergies/food restrictions
const allergyOptions = [
  "Dairy",
  "Eggs",
  "Nuts",
  "Gluten",
  "Soy",
  "Fish",
  "Shellfish",
  "Wheat"
]

interface MealPlanDay {
  day: string;
  meals: {
    name: string;
    dish: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
    alternatives?: string[];
  }[];
}

interface MealPlan {
  dailyCalories: number;
  days: MealPlanDay[];
}

export default function AIMealPlan() {
  // User preferences
  const [goal, setGoal] = useState("weight_loss") 
  const [dietType, setDietType] = useState("any")
  const [allergies, setAllergies] = useState<string[]>([])
  const [cuisinePreference, setCuisinePreference] = useState<string[]>([])
  const [exclusions, setExclusions] = useState<string[]>([])
  const [currentExclusion, setCurrentExclusion] = useState("")
  const [dailyCalories, setDailyCalories] = useState(2000)
  const [days, setDays] = useState(7)
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [activeAlternative, setActiveAlternative] = useState<{day: number, meal: number, dish: string} | null>(null)
  
  // Handle exclusion foods input
  const addExclusion = () => {
    if (currentExclusion.trim() && !exclusions.includes(currentExclusion.trim())) {
      setExclusions([...exclusions, currentExclusion.trim()])
      setCurrentExclusion("")
    }
  }
  
  const removeExclusion = (item: string) => {
    setExclusions(exclusions.filter(i => i !== item))
  }
  
  const handleExclusionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addExclusion()
    }
  }
  
  // Toggle allergies selection
  const toggleAllergy = (value: string) => {
    setAllergies(
      allergies.includes(value)
        ? allergies.filter(item => item !== value)
        : [...allergies, value]
    )
  }
  
  // Toggle cuisine preferences
  const toggleCuisine = (value: string) => {
    setCuisinePreference(
      cuisinePreference.includes(value)
        ? cuisinePreference.filter(item => item !== value)
        : [...cuisinePreference, value]
    )
  }
  
  // Generate the meal plan
  const generateMealPlan = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await suggestMealPlan({
        goal,
        dietType: dietType === "any" ? undefined : dietType,
        allergies: allergies.length > 0 ? allergies : undefined,
        cuisinePreference: cuisinePreference.length > 0 ? cuisinePreference : undefined,
        exclusions: exclusions.length > 0 ? exclusions : undefined,
        dailyCalories,
        days
      })
      
      if (response.success && response.data) {
        try {
          // Try to parse JSON response
          const parsedData = JSON.parse(response.data)
          setMealPlan(parsedData)
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError)
          
          // Try to extract JSON from the response if it contains additional text
          const jsonMatch = response.data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            try {
              // Try to parse the extracted JSON
              const parsedData = JSON.parse(extractedJson);
              setMealPlan(parsedData);
              return;
            } catch (extractError) {
              console.error("Failed to parse extracted JSON:", extractError);
            }
          }
          
          // If we're still here, try to clean and fix common JSON issues
          try {
            // 1. Replace single quotes with double quotes
            let cleanedData = response.data.replace(/'/g, '"');
            
            // 2. Make sure property names are in double quotes
            cleanedData = cleanedData.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
            
            // 3. Try to parse again
            const parsedData = JSON.parse(cleanedData);
            setMealPlan(parsedData);
          } catch (cleanError) {
            // All parsing attempts failed
            setError("Could not process the meal plan data. Please try again.");
          }
        }
      } else {
        setError(response.error || "Failed to generate meal plan")
      }
    } catch (err) {
      setError("An error occurred while generating the meal plan")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle meal alternative selection
  const selectAlternative = (day: number, meal: number, alternative: string) => {
    if (!mealPlan) return
    
    const newMealPlan = { ...mealPlan }
    newMealPlan.days[day].meals[meal].dish = alternative
    setMealPlan(newMealPlan)
    setActiveAlternative(null)
  }
  
  // Reset and start over
  const handleStartOver = () => {
    setMealPlan(null)
    setError(null)
  }
  
  // Export meal plan as PDF
  const generatePDF = () => {
    if (!mealPlan) return
    
    // Create a new PDF document
    const doc = new jsPDF()
    
    // Add some styling
    doc.setFillColor(76, 175, 80) // Green
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F')
    
    // Add title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text(`${days}-Day Personalized Meal Plan`, doc.internal.pageSize.width / 2, 25, { align: 'center' })
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
    
    // Add preferences section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Your Preferences', 20, 55)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    let yPos = 65
    
    doc.text(`Goal: ${goal.replace('_', ' ')}`, 30, yPos); yPos += 7
    doc.text(`Diet Type: ${dietType}`, 30, yPos); yPos += 7
    if (allergies.length > 0) { doc.text(`Allergies: ${allergies.join(', ')}`, 30, yPos); yPos += 7 }
    doc.text(`Daily Calories: ${dailyCalories} kcal`, 30, yPos); yPos += 15
    
    // Add days
    mealPlan.days.forEach((day, dayIndex) => {
      // Add a new page for each day except the first
      if (dayIndex > 0) {
        doc.addPage()
        yPos = 20
      }
      
      // Day title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`Day ${dayIndex + 1}: ${day.day}`, 20, yPos)
      yPos += 10
      
      // Meals
      day.meals.forEach((meal, mealIndex) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`${meal.name} (${meal.time}) - ${meal.calories} kcal`, 20, yPos)
        yPos += 7
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`${meal.dish}`, 30, yPos)
        yPos += 7
        
        doc.setFontSize(10)
        doc.text(`Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g`, 30, yPos)
        yPos += 7
        
        if (meal.alternatives && meal.alternatives.length > 0) {
          doc.setFontSize(10)
          doc.setFont('helvetica', 'italic')
          doc.text('Alternatives:', 30, yPos)
          yPos += 5
          
          meal.alternatives.forEach(alt => {
            doc.text(`• ${alt}`, 35, yPos)
            yPos += 5
          })
        }
        
        yPos += 10
      })
    })
    
    // Save the PDF
    doc.save(`${days}_day_meal_plan.pdf`)
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create Your Meal Plan</h2>
          <Badge variant="green" className="flex items-center gap-1">
            <Cpu className="h-3 w-3" /> MealMitra AI
          </Badge>
        </div>
        
        {!mealPlan && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal">Your Goal</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="maintenance">Maintain Weight</SelectItem>
                      <SelectItem value="general_health">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dietType">Diet Type</Label>
                  <Select value={dietType} onValueChange={setDietType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select diet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="non-vegetarian">Non-vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Daily Calories ({dailyCalories} kcal)</Label>
                  <Slider 
                    min={1200}
                    max={3500}
                    step={100}
                    value={[dailyCalories]}
                    onValueChange={(value) => setDailyCalories(value[0])}
                    className="py-4"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Days ({days})</Label>
                  <Slider 
                    min={1}
                    max={14}
                    step={1}
                    value={[days]}
                    onValueChange={(value) => setDays(value[0])}
                    className="py-4"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Allergies/Restrictions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {allergyOptions.map((allergy) => (
                      <div key={allergy} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`allergy-${allergy}`} 
                          checked={allergies.includes(allergy)}
                          onCheckedChange={() => toggleAllergy(allergy)}
                        />
                        <Label htmlFor={`allergy-${allergy}`}>{allergy}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Cuisine Preferences</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <div key={cuisine} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cuisine-${cuisine}`} 
                          checked={cuisinePreference.includes(cuisine)}
                          onCheckedChange={() => toggleCuisine(cuisine)}
                        />
                        <Label htmlFor={`cuisine-${cuisine}`}>{cuisine}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Excluded Foods</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Food to exclude" 
                      value={currentExclusion}
                      onChange={(e) => setCurrentExclusion(e.target.value)}
                      onKeyDown={handleExclusionKeyDown}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={addExclusion}
                      disabled={!currentExclusion.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {exclusions.map((item, i) => (
                      <Badge key={i} variant="secondary" className="px-2 py-1">
                        {item}
                        <button 
                          onClick={() => removeExclusion(item)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
            
            <Button 
              onClick={generateMealPlan}
              className="w-full bg-green-600 hover:bg-green-700 mt-4"
            >
              Generate Meal Plan
            </Button>
          </div>
        )}
        
        {loading && (
          <div className="py-20 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
            <p className="mt-4 text-lg text-gray-600">Creating your personalized meal plan...</p>
            <p className="text-sm text-gray-500">This may take a minute</p>
          </div>
        )}
        
        {mealPlan && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Your {days}-Day Meal Plan</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleStartOver} className="flex items-center">
                  <RotateCw className="h-4 w-4 mr-1" /> Start Over
                </Button>
                <Button variant="outline" size="sm" onClick={generatePDF} className="flex items-center">
                  <Download className="h-4 w-4 mr-1" /> Download PDF
                </Button>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Daily Calorie Target:</p>
                  <p className="font-bold text-green-600 text-lg">{mealPlan.dailyCalories} kcal</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Meals per day:</p>
                  <p className="font-bold text-green-600 text-lg">4</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {mealPlan.days.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                    <h4 className="font-medium">{day.day}</h4>
                  </div>
                  <div className="divide-y">
                    {day.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 text-gray-500 mr-1" />
                              <span className="text-xs text-gray-500">{meal.time}</span>
                            </div>
                            <h5 className="font-medium text-gray-900">{meal.name}</h5>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-700">{meal.dish}</p>
                              {meal.alternatives && meal.alternatives.length > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 ml-1 text-green-600"
                                  onClick={() => setActiveAlternative(activeAlternative?.day === dayIndex && 
                                                                      activeAlternative?.meal === mealIndex ? 
                                                                      null : 
                                                                      {day: dayIndex, meal: mealIndex, dish: meal.dish})}
                                >
                                  Alternatives
                                </Button>
                              )}
                            </div>
                            
                            {/* Alternative options dropdown */}
                            {activeAlternative?.day === dayIndex && 
                             activeAlternative?.meal === mealIndex && 
                             meal.alternatives && (
                               <div className="mt-2 bg-green-50 p-2 rounded">
                                 <p className="text-xs font-medium text-gray-600 mb-1">Replace with:</p>
                                 <div className="space-y-1">
                                   {meal.alternatives.map((alt, idx) => (
                                     <button
                                       key={idx}
                                       className="block w-full text-left text-sm text-gray-700 hover:bg-green-100 p-1 rounded"
                                       onClick={() => selectAlternative(dayIndex, mealIndex, alt)}
                                     >
                                       {alt}
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">{meal.calories} kcal</p>
                            <div className="flex space-x-2 text-xs text-gray-500 mt-1">
                              <span>P: {meal.protein}g</span>
                              <span>C: {meal.carbs}g</span>
                              <span>F: {meal.fat}g</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 