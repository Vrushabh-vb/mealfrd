import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Star } from "lucide-react"

export default function Testimonials() {
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Lost 8kg in 3 months",
      content:
        "The meal plans are so well-tailored to my weight loss goals while still letting me enjoy my favorite Indian flavors. I never feel like I'm on a diet!",
      avatar: "/placeholder-user.jpg",
      rating: 5,
    },
    {
      name: "Rahul Verma",
      role: "Fitness enthusiast",
      content:
        "As someone who's into bodybuilding, I was struggling to find high-protein Indian meals. This platform solved that problem completely!",
      avatar: "/placeholder-user.jpg",
      rating: 5,
    },
    {
      name: "Ananya Patel",
      role: "Busy professional",
      content:
        "The budget-friendly meal options and grocery lists save me so much time and money. Everything is delicious and fits my vegetarian lifestyle.",
      avatar: "/placeholder-user.jpg",
      rating: 4,
    },
  ]

  return (
    <section id="testimonials" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">What Our Customers Say</h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Real results from real people following our Indian meal plans
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-green-100">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonial.rating ? "text-green-500 fill-green-500" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-center">"{testimonial.content}"</p>
              </CardContent>
              <CardFooter className="flex flex-col items-center pb-6">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
