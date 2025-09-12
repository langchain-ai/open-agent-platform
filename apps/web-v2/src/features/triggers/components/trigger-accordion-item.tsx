import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Trigger } from "@/types/triggers"

export function TriggerAccordionItem(props: {
  trigger: Trigger
}) {
  return (
    <AccordionItem value="item-1">
      <AccordionTrigger>
        <span className="flex flex-col items-start justify-start gap-2">
          <p>{props.trigger.displayName}</p>
          <p className="text-muted-foreground text-sm">{props.trigger.description}</p>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 text-balance">
        <p>
          Our flagship product combines cutting-edge technology with sleek
          design. Built with premium materials, it offers unparalleled
          performance and reliability.
        </p>
      </AccordionContent>
    </AccordionItem>
  )
}