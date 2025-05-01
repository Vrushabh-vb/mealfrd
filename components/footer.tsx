import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold text-green-500">MealMitra by - Vrushabh</h2>
            <p className="mt-2 text-gray-400">Personalized Indian meal plans for your fitness journey.</p>
            <div className="mt-4 flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-green-500">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-green-500">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-green-500">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-green-500">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Nutrition Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Recipe Database
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Fitness Tips
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-green-500">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} MealMitra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
