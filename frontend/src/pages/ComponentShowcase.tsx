import React from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Badge } from "../components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Toaster } from "../components/ui/sonner"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">GAIA: Component Showcase</h1>
            <p className="text-sm opacity-90">Development Preview</p>
          </div>
          <a href="/" className="text-sm hover:underline">← Back to Home</a>
        </div>
      </header>
      <div className="container mx-auto p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">ShadCN UI Components</h1>
          <p className="text-muted-foreground">Core components for GAIA PWA</p>
        </div>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <p className="text-sm text-muted-foreground">Various button variants</p>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Badges</h2>
        <p className="text-sm text-muted-foreground">Standard and hazard-specific badges</p>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <div className="flex flex-wrap gap-4">
          <Badge variant="flood">Flood</Badge>
          <Badge variant="typhoon">Typhoon</Badge>
          <Badge variant="earthquake">Earthquake</Badge>
          <Badge variant="fire">Fire</Badge>
          <Badge variant="landslide">Landslide</Badge>
        </div>
      </section>

      {/* Form Inputs Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Inputs</h2>
        <p className="text-sm text-muted-foreground">Text fields and text areas</p>
        <div className="max-w-md space-y-4">
          <Input type="text" placeholder="Name" />
          <Input type="email" placeholder="admin@gaia.gov.ph" />
          <Input type="password" placeholder="••••••••" />
          <Textarea placeholder="Describe hazard..." />
        </div>
      </section>

      {/* Dialog & Toast Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dialog & Toast</h2>
        <p className="text-sm text-muted-foreground">Modal dialogs and toast notifications</p>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Hazard Report</DialogTitle>
                <DialogDescription>
                  Are you sure you want to submit this flooding report for Quezon City?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button onClick={() => toast.success("Report submitted successfully!")}>
                  Submit Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => toast("Report submitted!", { description: "Your hazard report has been logged." })}>
            Success Toast
          </Button>
          <Button variant="destructive" onClick={() => toast.error("Validation failed", { description: "Please check all required fields." })}>
            Error Toast
          </Button>
          <Button variant="outline" onClick={() => toast("Loading hazard data...", { description: "Fetching latest reports from RSS feeds." })}>
            Loading Toast
          </Button>
        </div>
      </section>

      {/* Tabbed Interface Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tabbed Interface</h2>
        <p className="text-sm text-muted-foreground">Navigate between different views</p>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList>
            <TabsTrigger value="recent">Recent Reports</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="triage">Needs Triage</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="space-y-4">
            <p className="text-sm text-muted-foreground">Showing 12 recent hazard reports from the last 24 hours.</p>
          </TabsContent>
          <TabsContent value="verified" className="space-y-4">
            <p className="text-sm text-muted-foreground">Displaying verified hazard reports.</p>
          </TabsContent>
          <TabsContent value="triage" className="space-y-4">
            <p className="text-sm text-muted-foreground">Reports requiring manual validation.</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* Alert Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Alerts</h2>
        <p className="text-sm text-muted-foreground">System notifications</p>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            ShadCN UI components are now integrated with GAIA. All components support dark mode and are fully accessible (WCAG 2.1 Level AA).
          </AlertDescription>
        </Alert>
      </section>

      {/* Sample Hazard Report */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Sample Hazard Report</h2>
        <p className="text-sm text-muted-foreground">Example of a citizen-submitted fire hazard</p>
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Flooding reported in Quezon City, Metro Manila</CardTitle>
              <Badge variant="flood">Flood</Badge>
            </div>
            <CardDescription>Confidence: 89%</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Flooding reported on Quezon City, Metro Manila. Water level approximately 1.5 meters due to heavy rainfall.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">View Details</Button>
            <Button>Processing hazard data...</Button>
          </CardFooter>
        </Card>
      </section>
      </div>
      <Toaster />
    </div>
  )
}
