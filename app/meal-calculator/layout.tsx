import Navbar from "@/components/navbar"

export default function MealCalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
} 