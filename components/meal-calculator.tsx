"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Search, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  "fish": { calories: 206, protein: 22, carbs: 0, fat: 12, servingSize: "100g" },
  "chapati": { calories: 120, protein: 3.1, carbs: 18, fat: 3, servingSize: "1 chapati (30g)" },
  "brown rice": { calories: 111, protein: 2.3, carbs: 23, fat: 0.8, servingSize: "100g cooked" },
  "basmati rice": { calories: 121, protein: 2.7, carbs: 25, fat: 0.4, servingSize: "100g cooked" },
  "idli": { calories: 39, protein: 2, carbs: 8, fat: 0.1, servingSize: "1 idli (30g)" },
  "dosa": { calories: 120, protein: 3, carbs: 20, fat: 2, servingSize: "1 dosa (60g)" },
  "sambar": { calories: 65, protein: 3, carbs: 11, fat: 1, servingSize: "100g" },
  "chutney": { calories: 110, protein: 2, carbs: 9, fat: 7, servingSize: "2 tbsp (30g)" },
  "mango": { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, servingSize: "1 cup sliced (165g)" },
  "chickpeas": { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, servingSize: "100g cooked" },
  "peanuts": { calories: 567, protein: 25.8, carbs: 16, fat: 49.2, servingSize: "100g" },
  "ghee": { calories: 900, protein: 0, carbs: 0, fat: 100, servingSize: "1 tbsp (15g)" },
  "coconut": { calories: 354, protein: 3.3, carbs: 15, fat: 33, servingSize: "100g" },
  "masoor dal": { calories: 102, protein: 8, carbs: 17, fat: 0.4, servingSize: "100g cooked" },
  "toor dal": { calories: 116, protein: 7, carbs: 21, fat: 0.5, servingSize: "100g cooked" },
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

export default function MealCalculator() {
  // Custom meal calculator state
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
      
      // If nothing found, show an empty result
      setSearchResults([]);
      setIsSearching(false);
    } catch (error) {
      console.error("Error searching for food:", error);
      setIsSearching(false);
    }
  };
  
  // Add a food from search results to the meal
  const addFoodFromSearch = (item: NutritionalData) => {
    // Add the food to our custom foods reference
    const foodKey = item.name.toLowerCase().replace(/\s+/g, '_');
    setCustomFoods(prev => ({
      ...prev,
      [foodKey]: item
    }));
    
    // Add the food to our meal
    setCustomMealItems([
      ...customMealItems, 
      { 
        food: foodKey, 
        quantity: 1, 
        unit: "serving", 
        isCustom: true 
      }
    ]);
    
    // Clear search
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Meal Calculator</h2>
      </div>

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
      
      <div className="bg-green-50 p-4 rounded-md mt-4">
        <h3 className="font-semibold mb-2 text-green-800">Nutrition Summary:</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          <div className="bg-white p-2 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Calories</p>
            <p className="font-bold text-green-600">{customMealNutrition.calories} kcal</p>
          </div>
          <div className="bg-white p-2 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Protein</p>
            <p className="font-bold text-green-600">{customMealNutrition.protein}g</p>
          </div>
          <div className="bg-white p-2 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Carbs</p>
            <p className="font-bold text-green-600">{customMealNutrition.carbs}g</p>
          </div>
          <div className="bg-white p-2 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Fat</p>
            <p className="font-bold text-green-600">{customMealNutrition.fat}g</p>
          </div>
          <div className="bg-white p-2 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Sugar</p>
            <p className="font-bold text-green-600">{customMealNutrition.sugar}g</p>
          </div>
          <div className="bg-white p-2 rounded-md shadow-sm">
            <p className="text-sm text-gray-500">Fiber</p>
            <p className="font-bold text-green-600">{customMealNutrition.fiber}g</p>
          </div>
        </div>
      </div>
    </div>
  )
} 