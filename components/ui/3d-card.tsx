"use client"

import { useState, useRef, ReactNode, ElementType, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
  HTMLMotionProps
} from "framer-motion"

interface CardContainerProps {
  children: ReactNode
  className?: string
}

export function CardContainer({
  children,
  className
}: CardContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 })

  const cardRotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"])
  const cardRotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    
    x.set(px - 0.5)
    y.set(py - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div className={cn("relative perspective-1500", className)}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          rotateX: cardRotateX,
          rotateY: cardRotateY
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function CardBody({
  children,
  className,
  ...props
}: CardBodyProps) {
  return (
    <div
      className={cn(
        "h-full w-full rounded-xl border bg-white p-6 shadow-xl",
        className
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardItemProps {
  as?: ElementType
  children: ReactNode
  className?: string
  translateX?: number
  translateY?: number
  translateZ?: number | string
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  style?: React.CSSProperties
  [key: string]: any
}

export function CardItem({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  style = {},
  ...rest
}: CardItemProps) {
  let zValue = translateZ;
  if (typeof translateZ === 'string' && !translateZ.endsWith('px')) {
    zValue = parseInt(translateZ);
  }
  
  const transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${zValue}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`

  return (
    <Tag
      className={cn("", className)}
      style={{
        transform,
        transformStyle: "preserve-3d",
        ...style
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
} 