/**
 * ShadCN UI Components - Central Export
 * This barrel file exports all ShadCN UI components for easier imports
 */

// Core Components
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "./card"

export { Input } from "./input"
export type { InputProps } from "./input"

export { Textarea } from "./textarea"
export type { TextareaProps } from "./textarea"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select"

// Feedback Components
export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"

export { Alert, AlertTitle, AlertDescription } from "./alert"

export { Toaster } from "./sonner"

// Overlay Components
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog"

// Data Display
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table"

export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
