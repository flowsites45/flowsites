export const springs = {
  soft: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
  bouncy: { type: "spring", stiffness: 200, damping: 15, mass: 1 },
  elastic: { type: "spring", stiffness: 400, damping: 10, mass: 0.8 },
  slow: { type: "spring", stiffness: 50, damping: 20, mass: 1.5 }
}

export const staggerContainer = {}

export const fadeSlideUp = {}

export const fadeSlideLeft = {}

export const hoverCard = {
  rest: { boxShadow: "0 10px 40px -10px rgba(0,0,0,0.03)" },
  hover: { 
    boxShadow: "0 20px 50px -15px rgba(0,0,0,0.08)",
    transition: springs.soft
  }
}

export const elasticButton = {
  hover: { transition: springs.bouncy },
  tap: { transition: springs.elastic }
}
