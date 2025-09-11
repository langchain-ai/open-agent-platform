import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Pick a date and time",
  className,
}: DateTimePickerProps) {
  const [time, setTime] = React.useState<string>("10:30");
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(":");
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
      
      // Check if the selected datetime is in the past
      const now = new Date();
      if (newDate <= now) {
        // If in the past, don't update the date state yet
        // The validation will happen in handleConfirm
        return;
      }
      
      setDate(newDate);
    }
  };

  const handleConfirm = () => {
    if (date) {
      const [hours, minutes] = time.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
      
      // Check if the selected datetime is in the past
      const now = new Date();
      if (newDate <= now) {
        // If in the past, set to current time + 1 minute minimum
        const minimumTime = new Date(now.getTime() + 60000); // Add 1 minute
        setDate(minimumTime);
        
        // Update the time input to reflect the adjusted time
        const adjustedHours = minimumTime.getHours().toString().padStart(2, "0");
        const adjustedMinutes = minimumTime.getMinutes().toString().padStart(2, "0");
        setTime(`${adjustedHours}:${adjustedMinutes}`);
      } else {
        setDate(newDate);
      }
    }
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
  }, [date]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start text-left font-normal h-11 px-4 bg-background hover:bg-accent hover:text-accent-foreground border-input shadow-sm transition-all duration-200",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
          {date ? (
            <span className="font-medium">{format(date, "PPP 'at' p")}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border-0"
        align="start"
      >
        <div className="flex bg-card rounded-lg overflow-hidden">
          <div className="min-w-[320px]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
              className="border-0 shadow-none"
            />
          </div>
          <div className="flex flex-col gap-4 border-l bg-muted/30 px-6 py-6 min-w-[160px]">
            <div className="space-y-3">
              <Label
                htmlFor="time"
                className="text-sm font-semibold text-foreground"
              >
                Select Time
              </Label>
              <div className="flex items-center gap-3 p-3 bg-background rounded-md border shadow-sm">
                <Clock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-sm font-medium focus-visible:ring-0"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200"
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
