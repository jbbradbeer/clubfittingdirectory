interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`bg-white border border-[var(--color-border)] rounded-lg overflow-hidden ${
        hover ? "transition-shadow duration-200 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 pt-5 pb-3 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-3 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 pt-3 pb-5 border-t border-[var(--color-cream-dark)] ${className}`}>
      {children}
    </div>
  )
}
