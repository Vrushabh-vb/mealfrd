"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, X, Cpu, Download, Share2, Mail, Image } from "lucide-react"
import { suggestMeal } from "@/lib/lm-studio"
import { jsPDF } from "jspdf"
import 'jspdf-autotable'

export default function AIMealSuggestion() {
  const [ingredients, setIngredients] = useState<string[]>([])
  const [currentIngredient, setCurrentIngredient] = useState("")
  const [dietType, setDietType] = useState("any")
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState<{
    name: string;
    ingredients: string[];
    additionalIngredients?: string[];
    instructions: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()])
      setCurrentIngredient("")
    }
  }

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  }

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setError("Please add at least one ingredient")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await suggestMeal(ingredients, {
        dietType: dietType === "any" ? undefined : dietType
      })
      
      if (response.success && response.data) {
        // Try to parse the JSON response
        try {
          // If it's a JSON string
          const parsedData = JSON.parse(response.data)
          setRecipe({
            name: parsedData.name || "Custom Recipe",
            ingredients: parsedData.ingredients || [],
            additionalIngredients: parsedData.additionalIngredients || [],
            instructions: parsedData.instructions || "",
            nutrition: {
              calories: parsedData.nutrition?.calories || 0,
              protein: parsedData.nutrition?.protein || 0,
              carbs: parsedData.nutrition?.carbs || 0,
              fat: parsedData.nutrition?.fat || 0
            }
          })
        } catch (parseError) {
          // If it's not valid JSON, try to extract information using regex
          // This is a fallback method since LLMs don't always return perfect JSON
          const nameMatch = response.data.match(/Recipe name:?\s*(.+?)(?:\n|$)/i) || 
                           response.data.match(/([A-Za-z][A-Za-z\s&'-]+)(?=\n)/);
          const ingredientsMatch = response.data.match(/(?:Core\s*)?[Ii]ngredients:?\s*([\s\S]*?)(?:Optional|Additional|Suggested|Instructions|Steps|Directions|$)/i);
          const additionalIngredientsMatch = response.data.match(/(?:Optional|Additional|Suggested)(?:\s*[Ii]ngredients)?:?\s*([\s\S]*?)(?:Instructions|Steps|Directions|$)/i);
          const instructionsMatch = response.data.match(/(?:Instructions|Steps|Directions):?\s*([\s\S]*?)(?:Nutrition|Calories|Macronutrients|$)/i);
          
          // Improved regex patterns for nutrition information
          const caloriesMatch = response.data.match(/(?:Calories|Cal)(?:ories)?:?\s*(\d+(?:\.\d+)?)(?:\s*kcal)?/i);
          const proteinMatch = response.data.match(/Protein:?\s*(\d+(?:\.\d+)?)(?:\s*g(?:rams)?)?/i);
          const carbsMatch = response.data.match(/(?:Carbs|Carbohydrates):?\s*(\d+(?:\.\d+)?)(?:\s*g(?:rams)?)?/i);
          const fatMatch = response.data.match(/Fat:?\s*(\d+(?:\.\d+)?)(?:\s*g(?:rams)?)?/i);
          
          // Fallback - try to find any numbers with "g" or "kcal" in the nutritional section
          const nutritionSection = response.data.match(/(?:Nutrition|Macronutrients|Nutritional information):?\s*([\s\S]*?)(?:$)/i);
          
          // Default values
          let calories = caloriesMatch ? parseFloat(caloriesMatch[1]) : 0;
          let protein = proteinMatch ? parseFloat(proteinMatch[1]) : 0;
          let carbs = carbsMatch ? parseFloat(carbsMatch[1]) : 0;
          let fat = fatMatch ? parseFloat(fatMatch[1]) : 0;
          
          // If we have a nutrition section and any values are still 0, try to extract them from the section
          if (nutritionSection && nutritionSection[1] && (calories === 0 || protein === 0 || carbs === 0 || fat === 0)) {
            const section = nutritionSection[1];
            
            if (calories === 0) {
              const fallbackCalories = section.match(/(\d+(?:\.\d+)?)\s*(?:kcal|calories)/i);
              if (fallbackCalories) calories = parseFloat(fallbackCalories[1]);
            }
            
            if (protein === 0) {
              const fallbackProtein = section.match(/(\d+(?:\.\d+)?)\s*g(?:rams)?\s*(?:protein|of protein)/i);
              if (fallbackProtein) protein = parseFloat(fallbackProtein[1]);
            }
            
            if (carbs === 0) {
              const fallbackCarbs = section.match(/(\d+(?:\.\d+)?)\s*g(?:rams)?\s*(?:carbs|carbohydrates|of carbs)/i);
              if (fallbackCarbs) carbs = parseFloat(fallbackCarbs[1]);
            }
            
            if (fat === 0) {
              const fallbackFat = section.match(/(\d+(?:\.\d+)?)\s*g(?:rams)?\s*(?:fat|of fat)/i);
              if (fallbackFat) fat = parseFloat(fallbackFat[1]);
            }
          }
          
          const extractedIngredients = ingredientsMatch ? 
            ingredientsMatch[1].split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.match(/^(Optional|Additional|Suggested|Instructions|Steps|Directions):/i)) : 
            [];
            
          const extractedAdditionalIngredients = additionalIngredientsMatch ? 
            additionalIngredientsMatch[1].split('\n')
              .map(line => line.trim())
              .filter(line => line && !line.match(/^(Instructions|Steps|Directions):/i)) : 
            [];
            
          // Extract a meaningful recipe name or use fallback
          let recipeName = "Custom Recipe";
          if (nameMatch && nameMatch[1]) {
            recipeName = nameMatch[1].trim();
          } else {
            // Try to create a name based on main ingredients
            const mainIngredients = ingredients.slice(0, 2);
            if (mainIngredients.length > 0) {
              recipeName = mainIngredients.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(" & ") + " Recipe";
            }
          }
            
          setRecipe({
            name: recipeName,
            ingredients: extractedIngredients,
            additionalIngredients: extractedAdditionalIngredients,
            instructions: instructionsMatch ? instructionsMatch[1].trim() : response.data,
            nutrition: {
              calories: calories,
              protein: protein,
              carbs: carbs,
              fat: fat
            }
          })
        }
      } else {
        setError(response.error || "Failed to generate recipe")
      }
    } catch (err) {
      setError("An error occurred while generating the recipe")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTryAgain = () => {
    setRecipe(null)
    setError(null)
  }

  const generatePDF = () => {
    if (!recipe) return;
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add some styling
    doc.setFillColor(76, 175, 80); // Green
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`${recipe.name} (Custom)`, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Add nutrition info section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Nutrition Information (per serving)', 20, 55);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Calories: ${recipe.nutrition.calories} kcal`, 30, 65);
    doc.text(`Protein: ${recipe.nutrition.protein}g`, 30, 75);
    doc.text(`Carbs: ${recipe.nutrition.carbs}g`, 30, 85);
    doc.text(`Fat: ${recipe.nutrition.fat}g`, 30, 95);
    
    // Add ingredients
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Core Ingredients', 20, 115);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let yPos = 125;
    recipe.ingredients.forEach((ingredient, index) => {
      doc.text(`• ${ingredient}`, 30, yPos);
      yPos += 10;
      
      // If we're approaching the bottom of the page, add a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Add additional ingredients if available
    if (recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      yPos += 10;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Suggested Additional Ingredients', 20, yPos);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      recipe.additionalIngredients.forEach((ingredient, index) => {
        doc.text(`• ${ingredient}`, 30, yPos);
        yPos += 10;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    }
    
    // Add instructions
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Instructions', 20, yPos);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    // Split instructions by new lines for better formatting
    const instructionLines = recipe.instructions.split(/\n/);
    instructionLines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      // Handle long text with wrapping
      const textLines = doc.splitTextToSize(line, doc.internal.pageSize.width - 40);
      textLines.forEach((textLine: string) => {
        doc.text(textLine, 20, yPos);
        yPos += 7;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      // Add space between paragraphs
      yPos += 3;
    });
    
    // Add footer with generation date
    const today = new Date();
    const dateString = today.toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated on ${dateString} | MealMitra`, doc.internal.pageSize.width / 2, 285, { align: 'center' });
    
    // Save the PDF
    doc.save(`${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`);
  };

  const shareViaWhatsApp = () => {
    if (!recipe) return;
    
    let recipeText = `Check out this recipe: ${recipe.name} (Custom)\n\nCore Ingredients:\n${recipe.ingredients.join('\n')}`;
    
    if (recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      recipeText += `\n\nSuggested Additional Ingredients:\n${recipe.additionalIngredients.join('\n')}`;
    }
    
    recipeText += `\n\nGenerated with MealMitra`;
    const encodedText = encodeURIComponent(recipeText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!recipe) return;
    
    const subject = `Recipe: ${recipe.name} (Custom)`;
    let body = `
I found this delicious recipe on MealMitra!

${recipe.name} (Custom)

Nutrition Information (per serving):
- Calories: ${recipe.nutrition.calories} kcal
- Protein: ${recipe.nutrition.protein}g
- Carbs: ${recipe.nutrition.carbs}g
- Fat: ${recipe.nutrition.fat}g

Core Ingredients:
${recipe.ingredients.join('\n')}
`;

    if (recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
      body += `
Suggested Additional Ingredients:
${recipe.additionalIngredients.join('\n')}
`;
    }

    body += `
Instructions:
${recipe.instructions}

Enjoy!
    `;
    
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  const saveAsImage = async () => {
    if (!recipe) return;
    
    // Create a promise to handle image generation
    const createImagePromise = async () => {
      return new Promise<void>((resolve) => {
        // Create a hidden container for recipe content
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '800px';
        container.style.backgroundColor = 'white';
        container.style.padding = '20px';
        container.style.fontFamily = 'Arial, sans-serif';
        
        // Build additional ingredients HTML if available
        let additionalIngredientsHTML = '';
        if (recipe.additionalIngredients && recipe.additionalIngredients.length > 0) {
          additionalIngredientsHTML = `
            <div style="margin-bottom: 20px;">
              <h2 style="color: #2D3748; font-size: 18px; margin-bottom: 10px;">Suggested Additional Ingredients:</h2>
              <ul style="padding-left: 20px; margin: 0;">
                ${recipe.additionalIngredients.map(ingredient => `<li style="margin-bottom: 5px; color: #4A5568;">${ingredient}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        // Add recipe content
        const recipeHTML = `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">${recipe.name} <span style="font-size: 16px; font-weight: normal;">(Custom)</span></h1>
            </div>
            
            <div style="padding: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="text-align: center; padding: 10px; background-color: #f0fff4; border-radius: 4px; width: 22%;">
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 14px;">Calories</p>
                  <p style="color: #4CAF50; margin: 0; font-weight: bold;">${recipe.nutrition.calories} kcal</p>
                </div>
                <div style="text-align: center; padding: 10px; background-color: #f0fff4; border-radius: 4px; width: 22%;">
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 14px;">Protein</p>
                  <p style="color: #4CAF50; margin: 0; font-weight: bold;">${recipe.nutrition.protein}g</p>
                </div>
                <div style="text-align: center; padding: 10px; background-color: #f0fff4; border-radius: 4px; width: 22%;">
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 14px;">Carbs</p>
                  <p style="color: #4CAF50; margin: 0; font-weight: bold;">${recipe.nutrition.carbs}g</p>
                </div>
                <div style="text-align: center; padding: 10px; background-color: #f0fff4; border-radius: 4px; width: 22%;">
                  <p style="color: #718096; margin: 0 0 5px 0; font-size: 14px;">Fat</p>
                  <p style="color: #4CAF50; margin: 0; font-weight: bold;">${recipe.nutrition.fat}g</p>
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="color: #2D3748; font-size: 18px; margin-bottom: 10px;">Core Ingredients:</h2>
                <ul style="padding-left: 20px; margin: 0;">
                  ${recipe.ingredients.map(ingredient => `<li style="margin-bottom: 5px; color: #4A5568;">${ingredient}</li>`).join('')}
                </ul>
              </div>
              
              ${additionalIngredientsHTML}
              
              <div>
                <h2 style="color: #2D3748; font-size: 18px; margin-bottom: 10px;">Instructions:</h2>
                <div style="color: #4A5568; white-space: pre-line;">
                  ${recipe.instructions}
                </div>
              </div>
              
              <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #A0AEC0;">
                Generated with MealMitra
              </div>
            </div>
          </div>
        `;
        
        container.innerHTML = recipeHTML;
        document.body.appendChild(container);
        
        setTimeout(() => {
          import('html2canvas').then(({ default: html2canvas }) => {
            html2canvas(container, { scale: 2 }).then(canvas => {
              // Create download link
              const link = document.createElement('a');
              link.download = `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              
              // Clean up
              document.body.removeChild(container);
              resolve();
            });
          }).catch(err => {
            console.error('Error loading html2canvas:', err);
            document.body.removeChild(container);
            resolve();
          });
        }, 100);
      });
    };
    
    try {
      await createImagePromise();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">AI Meal Suggestion</h2>
          <Badge variant="green" className="flex items-center gap-1">
            <Cpu className="h-3 w-3" /> MealMitra AI
          </Badge>
        </div>
        <p className="text-gray-600 mb-6">
          Enter ingredients you have, and our AI will suggest a recipe you can make!
        </p>

        {!recipe && !loading && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Ingredients you have
              </label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter an ingredient" 
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={addIngredient}
                  disabled={!currentIngredient.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {ingredients.map((ingredient, i) => (
                  <Badge key={i} variant="secondary" className="px-2 py-1">
                    {ingredient}
                    <button 
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-gray-700">
                Diet preference
              </label>
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

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <Button 
              onClick={generateRecipe}
              className="w-full bg-green-600 hover:bg-green-700 mt-4"
              disabled={ingredients.length === 0}
            >
              Generate Recipe
            </Button>
          </div>
        )}

        {loading && (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600">
              Our AI is creating a delicious recipe for you...
            </p>
          </div>
        )}

        {recipe && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-green-700">{recipe.name} <span className="text-sm font-normal text-gray-500">(Custom)</span></h3>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleTryAgain}>
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1" 
                  onClick={generatePDF}
                >
                  <Download className="h-4 w-4" /> Save PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-2 bg-green-50">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Calories</p>
                  <p className="font-bold text-green-600">{recipe.nutrition.calories} kcal</p>
                </div>
              </Card>
              <Card className="p-2 bg-green-50">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Protein</p>
                  <p className="font-bold text-green-600">{recipe.nutrition.protein}g</p>
                </div>
              </Card>
              <Card className="p-2 bg-green-50">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Carbs</p>
                  <p className="font-bold text-green-600">{recipe.nutrition.carbs}g</p>
                </div>
              </Card>
              <Card className="p-2 bg-green-50">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Fat</p>
                  <p className="font-bold text-green-600">{recipe.nutrition.fat}g</p>
                </div>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1" 
                onClick={shareViaWhatsApp}
              >
                <Share2 className="h-4 w-4" /> Share on WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1" 
                onClick={shareViaEmail}
              >
                <Mail className="h-4 w-4" /> Share via Email
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1" 
                onClick={saveAsImage}
              >
                <Image className="h-4 w-4" /> Save as Image
              </Button>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Core Ingredients:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {recipe.ingredients.map((ingredient, i) => (
                  <li key={i} className="text-gray-700">{ingredient}</li>
                ))}
              </ul>
            </div>

            {recipe.additionalIngredients && recipe.additionalIngredients.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Suggested Additional Ingredients:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {recipe.additionalIngredients.map((ingredient, i) => (
                    <li key={i} className="text-gray-700">{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Instructions:</h4>
              <div className="text-gray-700 whitespace-pre-line">
                {recipe.instructions}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 