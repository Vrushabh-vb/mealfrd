"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, Check, Loader2, Mail, Download, Calendar, Clock, Plus, Trash2, Search, Cpu } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { suggestMealPlan } from "@/lib/lm-studio"

// Food database with nutritional information per 100g or per standard serving
const foodDatabase = {
  "banana": { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: "1 medium (118g)" },
  "egg": { calories: 68, protein: 5.5, carbs: 0.6, fat: 4.8, servingSize: "1 large (50g)" },
  "oats": { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, servingSize: "100g" },
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g" },
  "rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: "100g cooked" },
  "whole wheat roti": { calories: 104, protein: 3, carbs: 17, fat: 3.3, servingSize: "1 roti (30g)" },
  "paneer": { calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, servingSize: "100g" },
  "lentils (dal)": { calories: 116, protein: 9, carbs: 20, fat: 0.4, servingSize: "100g cooked" },
  "milk": { calories: 42, protein: 3.4, carbs: 5, fat: 1, servingSize: "100ml" },
  "apple": { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, servingSize: "1 medium (182g)" },
  "almonds": { calories: 579, protein: 21.2, carbs: 21.7, fat: 49.9, servingSize: "100g" },
  "yogurt": { calories: 59, protein: 3.5, carbs: 5, fat: 3.3, servingSize: "100g" },
  "spinach": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: "100g" },
  "tomato": { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: "1 medium (123g)" },
  "potato": { calories: 77, protein: 2, carbs: 17, fat: 0.1, servingSize: "100g" },
  "fish": { calories: 206, protein: 22, carbs: 0, fat: 12, servingSize: "100g" }
};

// API integration for nutritional data
interface NutritionalData {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  serving_size_g: number;
  sugar_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
}

interface FruitData {
  name: string;
  nutritions: {
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
    sugar: number;
  }
}

export default function MealPlanBuilder() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    goal: "",
    dietType: "",
    allergies: [] as string[],
    budget: 500,
    cuisinePreference: [] as string[],
    name: "",
    email: "",
    height: "",
    weight: "",
    age: "",
    activityLevel: "moderate" // default activity level
  })
  
  // Custom meal calculator state
  const [showCustomMealCalculator, setShowCustomMealCalculator] = useState(false)
  const [customMealItems, setCustomMealItems] = useState<Array<{
    food: string,
    quantity: number,
    unit: string,
    isCustom?: boolean
  }>>([{ food: "", quantity: 1, unit: "serving" }])
  
  const [customMealNutrition, setCustomMealNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
    fiber: 0
  })
  
  // API search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NutritionalData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customFoods, setCustomFoods] = useState<Record<string, NutritionalData>>({});
  
  // AI meal plan state
  const [isGeneratingAiPlan, setIsGeneratingAiPlan] = useState(false)
  const [aiMealPlan, setAiMealPlan] = useState<{
    dailyCalories: number;
    days: {
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
    }[];
  } | null>(null)
  const [aiMealPlanError, setAiMealPlanError] = useState<string | null>(null)
  const [activeAlternative, setActiveAlternative] = useState<{day: number, meal: number, dish: string} | null>(null)
  
  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    if (!formData.weight || !formData.height || !formData.age) {
      return 2000; // Default value if no data provided
    }
    
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);
    
    // Check if values are valid numbers
    if (isNaN(weight) || isNaN(height) || isNaN(age)) {
      return 2000;
    }
    
    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    
    // Adjust for gender (using average since we don't collect gender data)
    bmr = bmr - 161; // Female adjustment
    
    // Activity level multiplier
    const activityMultipliers = {
      "sedentary": 1.2,      // Little or no exercise
      "light": 1.375,        // Light exercise 1-3 days/week
      "moderate": 1.55,      // Moderate exercise 3-5 days/week
      "active": 1.725,       // Heavy exercise 6-7 days/week
      "very_active": 1.9     // Very heavy exercise, physical job or training twice a day
    };
    
    const tdee = bmr * activityMultipliers[formData.activityLevel as keyof typeof activityMultipliers];
    
    // Adjust based on goal
    if (formData.goal === "weight-loss") {
      return Math.round(tdee * 0.85); // 15% deficit
    } else if (formData.goal === "muscle-gain") {
      return Math.round(tdee * 1.1); // 10% surplus
    } else {
      return Math.round(tdee); // Maintenance
    }
  };
  
  // Add item to custom meal
  const addCustomMealItem = () => {
    setCustomMealItems([...customMealItems, { food: "", quantity: 1, unit: "serving" }]);
  };
  
  // Remove item from custom meal
  const removeCustomMealItem = (index: number) => {
    if (customMealItems.length > 1) {
      const newItems = [...customMealItems];
      newItems.splice(index, 1);
      setCustomMealItems(newItems);
    }
  };
  
  // Handle changes to custom meal items
  const handleCustomMealItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...customMealItems];
    newItems[index] = { 
      ...newItems[index], 
      [field]: value 
    };
    setCustomMealItems(newItems);
  };
  
  // Search for food using CalorieNinjas API
  const searchFoodData = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // First try CalorieNinjas API for general foods
      try {
        const calorieNinjasResponse = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'X-Api-Key': '9arbYa+dKF6UUjc3ps2glw==bOrcSTbhfn6i2cgQ' // Note: In production, use environment variables
          }
        });
        
        if (calorieNinjasResponse.ok) {
          const data = await calorieNinjasResponse.json();
          if (data.items && data.items.length > 0) {
            setSearchResults(data.items);
            setIsSearching(false);
            return;
          }
        }
      } catch (calorieError) {
        console.error("Error with CalorieNinjas API:", calorieError);
        // Continue to next API if this one fails
      }
      
      // If no results from CalorieNinjas, try Fruityvice API for fruits
      try {
        // Use a CORS proxy to avoid CORS issues
        const corsProxy = "https://corsproxy.io/?";
        const fruityviceUrl = "https://fruityvice.com/api/fruit/all";
        const fruityviceResponse = await fetch(`${corsProxy}${encodeURIComponent(fruityviceUrl)}`);
        
        if (fruityviceResponse.ok) {
          const fruits: FruitData[] = await fruityviceResponse.json();
          const matchingFruits = fruits.filter(fruit => 
            fruit.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          if (matchingFruits.length > 0) {
            // Convert Fruityvice format to our format
            const convertedFruits: NutritionalData[] = matchingFruits.map(fruit => ({
              name: fruit.name,
              calories: fruit.nutritions.calories,
              protein_g: fruit.nutritions.protein,
              carbohydrates_total_g: fruit.nutritions.carbohydrates,
              fat_total_g: fruit.nutritions.fat,
              sugar_g: fruit.nutritions.sugar,
              serving_size_g: 100 // Standard serving size
            }));
            
            setSearchResults(convertedFruits);
            setIsSearching(false);
            return;
          }
        }
      } catch (fruitError) {
        console.error("Error with Fruityvice API:", fruitError);
      }
      
      // Fallback to our local database if APIs fail
      const localMatches = Object.entries(foodDatabase)
        .filter(([name]) => name.includes(searchQuery.toLowerCase()))
        .map(([name, data]) => ({
          name: name,
          calories: data.calories,
          protein_g: data.protein,
          carbohydrates_total_g: data.carbs,
          fat_total_g: data.fat,
          serving_size_g: 100,
        }));
        
      if (localMatches.length > 0) {
        setSearchResults(localMatches);
        setIsSearching(false);
        return;
      }
      
      // If still no results, show message
      setSearchResults([]);
      toast({
        title: "No results found",
        description: "We couldn't find nutritional data for that food item.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error("Error searching for food:", error);
      toast({
        title: "API Error",
        description: "There was an error searching for nutritional data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Add food item from search results to custom foods
  const addFoodFromSearch = (item: NutritionalData) => {
    // Add to custom foods database
    setCustomFoods(prev => ({
      ...prev,
      [item.name.toLowerCase()]: item
    }));
    
    // Add to current meal
    const newItem = {
      food: item.name.toLowerCase(),
      quantity: 1,
      unit: "serving",
      isCustom: true
    };
    
    setCustomMealItems(prev => [...prev, newItem]);
    setSearchResults([]);
    setSearchQuery("");
  };
  
  // Calculate nutrition for custom meal with API data support
  const calculateCustomMealNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalSugar = 0;
    let totalFiber = 0;
    
    customMealItems.forEach(item => {
      if (!item.food) return;
      
      // Check if it's a custom food from API
      if (item.isCustom && customFoods[item.food]) {
        const food = customFoods[item.food];
        const quantity = item.quantity;
        let multiplier = quantity;
        
        // Adjust for unit
        if (item.unit === "g") {
          multiplier = quantity / food.serving_size_g;
        }
        
        totalCalories += food.calories * multiplier;
        totalProtein += food.protein_g * multiplier;
        totalCarbs += food.carbohydrates_total_g * multiplier;
        totalFat += food.fat_total_g * multiplier;
        totalSugar += (food.sugar_g || 0) * multiplier;
        totalFiber += (food.fiber_g || 0) * multiplier;
      }
      // Check standard food database
      else if (foodDatabase[item.food as keyof typeof foodDatabase]) {
        const food = foodDatabase[item.food as keyof typeof foodDatabase];
        const quantity = item.quantity;
        let multiplier = quantity;
        
        // Adjust serving size based on unit
        if (item.unit === "g" && food.servingSize.includes("g")) {
          // Convert grams to proportion of standard serving
          const servingSizeGrams = parseInt(food.servingSize.match(/\((\d+)g\)/)![1]);
          multiplier = quantity / servingSizeGrams;
        }
        
        totalCalories += food.calories * multiplier;
        totalProtein += food.protein * multiplier;
        totalCarbs += food.carbs * multiplier;
        totalFat += food.fat * multiplier;
      }
    });
    
    setCustomMealNutrition({
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      sugar: Math.round(totalSugar * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10
    });
  };
  
  // Watch for changes to custom meal items and recalculate
  useEffect(() => {
    calculateCustomMealNutrition();
  }, [customMealItems]);

  // Sample meal plan data - would be generated dynamically based on user preferences
  const sampleMealPlan = {
    dailyCalories: calculateBMR(),
    days: [
      {
        day: "Monday",
        meals: [
          {
            name: "Breakfast",
            dish: formData.dietType === "non-vegetarian" ? "Egg Bhurji with Whole Wheat Roti" : "Masala Oats with Vegetables",
            calories: 320,
            protein: 18,
            carbs: 42,
            fat: 8,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Chicken Curry with Brown Rice" : "Rajma Chawal with Cucumber Raita",
            calories: 450,
            protein: 25,
            carbs: 60,
            fat: 12,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Mixed Sprouts Chaat",
            calories: 180,
            protein: 9,
            carbs: 28,
            fat: 3,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Grilled Fish with Sautéed Vegetables" : "Paneer Bhurji with Multigrain Roti",
            calories: 380,
            protein: 22,
            carbs: 35,
            fat: 15,
            time: "8:00 PM"
          }
        ]
      },
      {
        day: "Tuesday",
        meals: [
          {
            name: "Breakfast",
            dish: "Vegetable Upma with Green Chutney",
            calories: 310,
            protein: 14,
            carbs: 45,
            fat: 9,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Mutton Keema with Roti" : "Chole with Steamed Rice",
            calories: 420,
            protein: 24,
            carbs: 55,
            fat: 11,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Roasted Makhana with Green Tea",
            calories: 150,
            protein: 5,
            carbs: 20,
            fat: 4,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Egg Curry with Multigrain Roti" : "Dal Tadka with Jeera Rice",
            calories: 360,
            protein: 20,
            carbs: 38,
            fat: 12,
            time: "8:00 PM"
          }
        ]
      },
      {
        day: "Wednesday",
        meals: [
          {
            name: "Breakfast",
            dish: formData.dietType === "non-vegetarian" ? "Egg White Omelette with Multigrain Toast" : "Poha with Vegetables",
            calories: 290,
            protein: 16,
            carbs: 40,
            fat: 7,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Grilled Chicken Salad" : "Palak Paneer with Roti",
            calories: 410,
            protein: 28,
            carbs: 35,
            fat: 18,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Greek Yogurt with Berries",
            calories: 160,
            protein: 12,
            carbs: 18,
            fat: 5,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Baked Fish with Stir-Fried Vegetables" : "Chana Masala with Steamed Rice",
            calories: 390,
            protein: 24,
            carbs: 45,
            fat: 10,
            time: "8:00 PM"
          }
        ]
      },
      {
        day: "Thursday",
        meals: [
          {
            name: "Breakfast",
            dish: "Vegetable Idli with Sambar",
            calories: 280,
            protein: 12,
            carbs: 48,
            fat: 4,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Tandoori Chicken with Mint Chutney" : "Mixed Vegetable Curry with Roti",
            calories: 430,
            protein: 26,
            carbs: 42,
            fat: 16,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Cucumber and Carrot Sticks with Hummus",
            calories: 140,
            protein: 6,
            carbs: 15,
            fat: 7,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Chicken Seekh Kabab with Mint Chutney" : "Baingan Bharta with Roti",
            calories: 360,
            protein: 22,
            carbs: 30,
            fat: 16,
            time: "8:00 PM"
          }
        ]
      },
      {
        day: "Friday",
        meals: [
          {
            name: "Breakfast",
            dish: formData.dietType === "non-vegetarian" ? "Chicken Sandwich with Mint Chutney" : "Besan Chilla with Yogurt",
            calories: 320,
            protein: 18,
            carbs: 38,
            fat: 10,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Fish Curry with Brown Rice" : "Aloo Gobi with Roti",
            calories: 440,
            protein: 24,
            carbs: 58,
            fat: 12,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Mixed Nuts and Dried Fruits",
            calories: 180,
            protein: 6,
            carbs: 12,
            fat: 14,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Chicken Biryani with Raita" : "Mushroom Matar with Jeera Rice",
            calories: 420,
            protein: 20,
            carbs: 52,
            fat: 14,
            time: "8:00 PM"
          }
        ]
      },
      {
        day: "Saturday",
        meals: [
          {
            name: "Breakfast",
            dish: "Dosa with Coconut Chutney and Sambar",
            calories: 340,
            protein: 10,
            carbs: 52,
            fat: 10,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Butter Chicken with Naan" : "Malai Kofta with Pulao",
            calories: 520,
            protein: 22,
            carbs: 60,
            fat: 20,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Fruit Chaat with Chaat Masala",
            calories: 160,
            protein: 3,
            carbs: 38,
            fat: 1,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Grilled Lamb Chops with Mint Sauce" : "Paneer Tikka Masala with Roti",
            calories: 450,
            protein: 28,
            carbs: 30,
            fat: 25,
            time: "8:00 PM"
          }
        ]
      },
      {
        day: "Sunday",
        meals: [
          {
            name: "Breakfast",
            dish: formData.dietType === "non-vegetarian" ? "Akuri (Parsi Style Scrambled Eggs) with Toast" : "Aloo Paratha with Yogurt",
            calories: 380,
            protein: 14,
            carbs: 45,
            fat: 16,
            time: "8:00 AM"
          },
          {
            name: "Lunch",
            dish: formData.dietType === "non-vegetarian" ? "Mutton Rogan Josh with Jeera Rice" : "Kadai Paneer with Naan",
            calories: 550,
            protein: 26,
            carbs: 55,
            fat: 22,
            time: "1:00 PM"
          },
          {
            name: "Snack",
            dish: "Baked Samosa with Mint Chutney",
            calories: 220,
            protein: 5,
            carbs: 32,
            fat: 9,
            time: "4:30 PM"
          },
          {
            name: "Dinner",
            dish: formData.dietType === "non-vegetarian" ? "Goan Fish Curry with Red Rice" : "Mix Vegetable Korma with Pulao",
            calories: 430,
            protein: 22,
            carbs: 48,
            fat: 18,
            time: "8:00 PM"
          }
        ]
      }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.email) {
      alert("Please fill in your name and email");
      return;
    }
    
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Successfully submitted
      setSubmitted(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      setIsSubmitting(false)
      alert("There was an error creating your meal plan. Please try again.")
    }
  }

  const handleAllergiesChange = (value: string) => {
    setFormData((prev) => {
      const allergies = [...prev.allergies]
      if (allergies.includes(value)) {
        return { ...prev, allergies: allergies.filter((item) => item !== value) }
      } else {
        return { ...prev, allergies: [...allergies, value] }
      }
    })
  }

  const handleCuisineChange = (value: string) => {
    setFormData((prev) => {
      const cuisinePreference = [...prev.cuisinePreference]
      if (cuisinePreference.includes(value)) {
        return { ...prev, cuisinePreference: cuisinePreference.filter((item) => item !== value) }
      } else {
        return { ...prev, cuisinePreference: [...cuisinePreference, value] }
      }
    })
  }

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Set title
      doc.setFontSize(18);
      doc.text("Your Personalized Indian Meal Plan", 105, 15, { align: 'center' });
      
      // Add user information
      doc.setFontSize(11);
      doc.text(`Created for: ${formData.name}`, 15, 25);
      doc.text(`Goal: ${formData.goal || "Custom Nutrition"}`, 15, 32);
      doc.text(`Diet Type: ${formData.dietType || "Mixed"}`, 15, 39);
      doc.text(`Daily Calories: ${sampleMealPlan.dailyCalories} kcal`, 15, 46);
      
      let yPos = 55;
      
      // Add meal plans for each day
      sampleMealPlan.days.forEach((day, index) => {
        // Day header
        doc.setFillColor(230, 230, 230);
        doc.rect(15, yPos, 180, 7, 'F');
        doc.setFontSize(12);
        doc.text(`${day.day}`, 17, yPos + 5);
        yPos += 10;
        
        // Add each meal
        day.meals.forEach(meal => {
          // Create a new page if we're running out of space
          if (yPos > 270) {
            doc.addPage();
            yPos = 15;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${meal.name} (${meal.time})`, 17, yPos);
          yPos += 5;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`${meal.dish}`, 17, yPos);
          yPos += 5;
          
          doc.setFontSize(9);
          doc.text(`Calories: ${meal.calories} kcal | Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g`, 17, yPos);
          yPos += 8;
        });
        
        // Add spacing between days
        yPos += 5;
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Generated for ${formData.name} | MealMitra - Indian Meal Plans`, 105, 290, { align: 'center' });
      }
      
      // Save the PDF
      doc.save(`MealPlan_${formData.name.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error creating your PDF. Please try again.");
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  // Generate AI meal plan based on current preferences
  const generateAIMealPlan = async () => {
    setIsGeneratingAiPlan(true)
    setAiMealPlanError(null)
    
    try {
      const response = await suggestMealPlan({
        goal: formData.goal || "general_health",
        dietType: formData.dietType || undefined,
        allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
        cuisinePreference: formData.cuisinePreference.length > 0 ? formData.cuisinePreference : undefined,
        dailyCalories: calculateBMR(),
        days: 7
      })
      
      if (response.success && response.data) {
        try {
          // Try to parse JSON response
          const parsedData = JSON.parse(response.data)
          setAiMealPlan(parsedData)
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError)
          
          // Try to extract JSON from the response if it contains additional text
          const jsonMatch = response.data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            try {
              // Try to parse the extracted JSON
              const parsedData = JSON.parse(extractedJson);
              setAiMealPlan(parsedData);
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
            setAiMealPlan(parsedData);
          } catch (cleanError) {
            // All parsing attempts failed
            setAiMealPlanError("Could not process the meal plan data. Please try again.");
          }
        }
      } else {
        setAiMealPlanError(response.error || "Failed to generate meal plan")
      }
    } catch (err) {
      setAiMealPlanError("An error occurred while generating the meal plan")
      console.error(err)
    } finally {
      setIsGeneratingAiPlan(false)
    }
  }
  
  // Handle meal alternative selection
  const selectAlternative = (day: number, meal: number, alternative: string) => {
    if (!aiMealPlan) return
    
    const newMealPlan = { ...aiMealPlan }
    newMealPlan.days[day].meals[meal].dish = alternative
    setAiMealPlan(newMealPlan)
    setActiveAlternative(null)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-green-200 shadow-lg">
        <CardContent className="p-6">
          <Tabs value={`step-${step}`} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="step-1"
                onClick={() => setStep(1)}
                disabled={step < 1}
                className={
                  step >= 1 ? "bg-green-100 data-[state=active]:bg-green-600 data-[state=active]:text-white" : ""
                }
              >
                Goals
              </TabsTrigger>
              <TabsTrigger
                value="step-2"
                onClick={() => setStep(2)}
                disabled={step < 2}
                className={
                  step >= 2 ? "bg-green-100 data-[state=active]:bg-green-600 data-[state=active]:text-white" : ""
                }
              >
                Diet
              </TabsTrigger>
              <TabsTrigger
                value="step-3"
                onClick={() => setStep(3)}
                disabled={step < 3}
                className={
                  step >= 3 ? "bg-green-100 data-[state=active]:bg-green-600 data-[state=active]:text-white" : ""
                }
              >
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="step-4"
                onClick={() => setStep(4)}
                disabled={step < 4}
                className={
                  step >= 4 ? "bg-green-100 data-[state=active]:bg-green-600 data-[state=active]:text-white" : ""
                }
              >
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="step-1" className="mt-6">
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">What is your fitness goal?</h3>
                <RadioGroup
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="weight-loss" id="weight-loss" className="peer sr-only" />
                    <Label
                      htmlFor="weight-loss"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                    >
                      <div className="mb-2 p-2 rounded-full bg-green-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-600"
                        >
                          <path d="M18.5 20h-13a2.5 2.5 0 0 1 0-5h13a2.5 2.5 0 0 1 0 5Z" />
                          <path d="M18.5 16.5v-10a2.5 2.5 0 0 0-2.5-2.5h-8a2.5 2.5 0 0 0-2.5 2.5v10" />
                        </svg>
                      </div>
                      <div className="font-semibold">Weight Loss</div>
                      <div className="text-sm text-gray-500 text-center">Fat loss with healthy Indian options</div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="muscle-gain" id="muscle-gain" className="peer sr-only" />
                    <Label
                      htmlFor="muscle-gain"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                    >
                      <div className="mb-2 p-2 rounded-full bg-green-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-600"
                        >
                          <path d="M4 20v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
                          <path d="M12 10v6" />
                          <path d="M12 3v3" />
                        </svg>
                      </div>
                      <div className="font-semibold">Muscle Gain</div>
                      <div className="text-sm text-gray-500 text-center">High-protein Indian meals</div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="maintenance" id="maintenance" className="peer sr-only" />
                    <Label
                      htmlFor="maintenance"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                    >
                      <div className="mb-2 p-2 rounded-full bg-green-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-600"
                        >
                          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
                        </svg>
                      </div>
                      <div className="font-semibold">Healthy Lifestyle</div>
                      <div className="text-sm text-gray-500 text-center">Balanced nutrition for maintenance</div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="athletic" id="athletic" className="peer sr-only" />
                    <Label
                      htmlFor="athletic"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                    >
                      <div className="mb-2 p-2 rounded-full bg-green-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-600"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="font-semibold">Athletic Performance</div>
                      <div className="text-sm text-gray-500 text-center">Strength and endurance training</div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.goal}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="step-2" className="mt-6">
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Dietary Preferences & Allergies</h3>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Diet Type</h4>
                  <RadioGroup
                    value={formData.dietType}
                    onValueChange={(value) => setFormData({ ...formData, dietType: value })}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="vegetarian" id="vegetarian" className="peer sr-only" />
                      <Label
                        htmlFor="vegetarian"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                      >
                        <div className="font-medium">Vegetarian</div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="vegan" id="vegan" className="peer sr-only" />
                      <Label
                        htmlFor="vegan"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                      >
                        <div className="font-medium">Vegan</div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="non-vegetarian" id="non-vegetarian" className="peer sr-only" />
                      <Label
                        htmlFor="non-vegetarian"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                      >
                        <div className="font-medium">Non-Vegetarian</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Allergies & Restrictions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {["Lactose-Free", "Gluten-Free", "Nut-Free", "Jain", "Low-Carb", "Low-Fat"].map((allergy) => (
                      <div key={allergy} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergy-${allergy}`}
                          checked={formData.allergies.includes(allergy)}
                          onCheckedChange={() => handleAllergiesChange(allergy)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <label
                          htmlFor={`allergy-${allergy}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {allergy}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.dietType}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="step-3" className="mt-6">
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Preferences & Budget</h3>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Cuisine Preferences</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {["North Indian", "South Indian", "Low-Oil Cooking", "Quick Recipes", "Traditional Foods"].map(
                      (cuisine) => (
                        <div key={cuisine} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cuisine-${cuisine}`}
                            checked={formData.cuisinePreference.includes(cuisine)}
                            onCheckedChange={() => handleCuisineChange(cuisine)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <label
                            htmlFor={`cuisine-${cuisine}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {cuisine}
                          </label>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-gray-700">Budget (₹ per day)</h4>
                    <span className="font-medium text-green-600">₹{formData.budget}</span>
                  </div>
                  <Slider
                    value={[formData.budget]}
                    min={100}
                    max={1000}
                    step={50}
                    onValueChange={(value) => setFormData({ ...formData, budget: value[0] })}
                    className="[&>span]:bg-green-600"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>₹100</span>
                    <span>₹1000</span>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="bg-green-600 hover:bg-green-700">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="step-4" className="mt-6">
              {submitted ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mt-4">Your Meal Plan is Ready!</h3>
                    <p className="text-gray-600 mt-2">
                      Here's your personalized meal plan based on your preferences, {formData.name}!
                    </p>
                  </div>

                  {/* Meal Plan Overview */}
                  <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">7-Day Indian Meal Plan</h4>
                      <p className="text-gray-600 text-sm">Based on {formData.goal || "your goals"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Daily Average</p>
                      <p className="font-bold text-green-600">{sampleMealPlan.dailyCalories} kcal</p>
                    </div>
                  </div>
                  
                  {/* Custom Meal Calculator */}
                  <div className="border rounded-lg p-4">
                    <button 
                      onClick={() => setShowCustomMealCalculator(!showCustomMealCalculator)}
                      className="flex items-center font-medium text-green-600 hover:text-green-800"
                    >
                      {showCustomMealCalculator ? "Hide" : "Show"} Custom Meal Calculator
                      <ArrowRight className={`ml-2 h-4 w-4 transition-transform ${showCustomMealCalculator ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showCustomMealCalculator && (
                      <div className="mt-4 space-y-4">
                        <h4 className="font-medium">Create your own meal and calculate nutrition:</h4>
                        
                        {/* API Search Section */}
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <Input
                              placeholder="Search for food items (e.g. 'apple', 'chicken breast')"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={searchFoodData}
                            disabled={isSearching || !searchQuery.trim()}
                          >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                        
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                          <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                            <h5 className="font-medium mb-2">Search Results:</h5>
                            <div className="space-y-2">
                              {searchResults.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => addFoodFromSearch(item)}>
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-gray-500">Serving: {item.serving_size_g}g</p>
                                  </div>
                                  <div className="text-right text-xs">
                                    <p>{item.calories} kcal</p>
                                    <p>P: {item.protein_g}g | C: {item.carbohydrates_total_g}g | F: {item.fat_total_g}g</p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="ml-2">
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {customMealItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex-1">
                                {item.isCustom ? (
                                  <Input value={item.food} disabled className="bg-gray-50" />
                                ) : (
                                  <Select
                                    value={item.food}
                                    onValueChange={(value) => handleCustomMealItemChange(index, 'food', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select food" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.keys(foodDatabase).map(food => (
                                        <SelectItem key={food} value={food}>
                                          {food.charAt(0).toUpperCase() + food.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              
                              <div className="w-20">
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={item.quantity}
                                  onChange={(e) => handleCustomMealItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              
                              <div className="w-28">
                                <Select
                                  value={item.unit}
                                  onValueChange={(value) => handleCustomMealItemChange(index, 'unit', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="serving">serving</SelectItem>
                                    <SelectItem value="g">grams</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomMealItem(index)}
                                disabled={customMealItems.length === 1 && index === 0}
                              >
                                <Trash2 className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <Button variant="outline" size="sm" onClick={addCustomMealItem} className="mt-2">
                          <Plus className="h-4 w-4 mr-1" /> Add Item
                        </Button>
                        
                        <div className="bg-gray-50 p-3 rounded-md mt-4">
                          <h5 className="font-medium mb-2">Nutrition Summary:</h5>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
                            <div>
                              <p className="text-sm text-gray-500">Calories</p>
                              <p className="font-bold">{customMealNutrition.calories} kcal</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Protein</p>
                              <p className="font-bold">{customMealNutrition.protein}g</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Carbs</p>
                              <p className="font-bold">{customMealNutrition.carbs}g</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fat</p>
                              <p className="font-bold">{customMealNutrition.fat}g</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Sugar</p>
                              <p className="font-bold">{customMealNutrition.sugar}g</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fiber</p>
                              <p className="font-bold">{customMealNutrition.fiber}g</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sample Days */}
                  <div className="space-y-6">
                    {/* Add AI Meal Plan Generator Button */}
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-lg">Daily Calorie Target: {aiMealPlan ? aiMealPlan.dailyCalories : calculateBMR()} kcal</h4>
                      
                      {!isGeneratingAiPlan && !aiMealPlan && (
                        <Button 
                          onClick={generateAIMealPlan} 
                          className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Cpu className="mr-2 h-4 w-4" />
                          Generate AI Meal Plan
                        </Button>
                      )}
                      
                      {isGeneratingAiPlan && (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Generating your plan...</span>
                        </div>
                      )}
                    </div>
                    
                    {aiMealPlanError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
                        {aiMealPlanError}
                      </div>
                    )}
                    
                    {/* Display AI meal plan or sample meal plan */}
                    {aiMealPlan ? (
                      // AI-generated meal plan
                      aiMealPlan.days.map((day, dayIndex) => (
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
                      ))
                    ) : (
                      // Default static meal plan
                      sampleMealPlan.days.map((day, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
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
                                    <p className="text-sm text-gray-700">{meal.dish}</p>
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
                      ))
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8">
                    <Button
                      variant="outline"
                      className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        // Here you would trigger an email sending function
                        alert(`We've sent your meal plan to ${formData.email}!`);
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Receive via Email
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                      onClick={handleDownloadPDF}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        // Reset form
                        setSubmitted(false);
                        setStep(1);
                        setFormData({
                          goal: "",
                          dietType: "",
                          allergies: [],
                          budget: 500,
                          cuisinePreference: [],
                          name: "",
                          email: "",
                          height: "",
                          weight: "",
                          age: "",
                          activityLevel: "moderate"
                        });
                      }}
                    >
                      Create Another Plan
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="Height in cm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="Weight in kg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Your age"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="activity-level">Activity Level</Label>
                    <Select
                      value={formData.activityLevel}
                      onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
                    >
                      <SelectTrigger id="activity-level">
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                        <SelectItem value="light">Lightly active (light exercise 1-3 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
                        <SelectItem value="active">Very active (hard exercise 6-7 days/week)</SelectItem>
                        <SelectItem value="very_active">Extra active (very hard exercise & physical job)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !formData.name || !formData.email}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating your plan...
                        </>
                      ) : (
                        <>
                          Create My Meal Plan <Check className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
