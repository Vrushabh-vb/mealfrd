import Navbar from "@/components/navbar"

export default function AIMealGeneratorLayout({
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