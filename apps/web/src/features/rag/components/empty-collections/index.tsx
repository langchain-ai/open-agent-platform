import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderPlus, Layers } from "lucide-react"

export default function EmptyCollectionsState() {
  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
        <div className="bg-primary/10 p-4 rounded-full">
          <Layers className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold tracking-tight">No collections yet</h3>
          <p className="text-muted-foreground">
            Collections help you organize your documents and resources in one place. Create your first collection to get
            started.
          </p>
        </div>

        <Button size="lg" className="mt-4 gap-2">
          <FolderPlus className="h-4 w-4" />
          Create your first collection
        </Button>
      </CardContent>
    </Card>
  )
}
