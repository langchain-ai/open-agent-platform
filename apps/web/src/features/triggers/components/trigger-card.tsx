"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TriggerForm } from "./trigger-form"
import type { Trigger } from "@/types/triggers"
import { Zap } from "lucide-react"

interface TriggerCardProps {
  trigger: Trigger
}

export function TriggerCard({ trigger }: TriggerCardProps) {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return <TriggerForm trigger={trigger} onCancel={() => setShowForm(false)} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {trigger.name}
        </CardTitle>
        {trigger.description && <CardDescription>{trigger.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowForm(true)} className="w-full">
          Register {trigger.name}
        </Button>
      </CardContent>
    </Card>
  )
}
