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
      setDate(newDate);
    }
  };

  const handleConfirm = () => {
    if (date) {
      const [hours, minutes] = time.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
      setDate(newDate);
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
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP 'at' p") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <div className="flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
          />
          <div className="flex flex-col gap-2 border-l px-3 py-4">
            <Label
              htmlFor="time"
              className="text-sm font-medium"
            >
              Time
            </Label>
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-24"
              />
            </div>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="mt-2"
            >
              Confirm
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
