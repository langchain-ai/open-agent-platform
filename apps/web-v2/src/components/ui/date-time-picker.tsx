"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Schedule for later...",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date,
  );
  const [timeValue, setTimeValue] = React.useState(
    date ? format(date, "HH:mm:ss") : "10:30:00",
  );

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    setDateOpen(false);

    if (newDate) {
      const today = new Date();
      const isToday = newDate.toDateString() === today.toDateString();

      // If selecting today and current time would be in the past, set a future time
      if (isToday) {
        const [hours, minutes, seconds] = timeValue.split(":").map(Number);
        const proposedDateTime = new Date(newDate);
        proposedDateTime.setHours(hours, minutes, seconds || 0, 0);

        if (proposedDateTime <= today) {
          // Set time to current time + 1 minute
          const futureTime = new Date(today.getTime() + 60000);
          const newTimeValue = format(futureTime, "HH:mm:ss");
          setTimeValue(newTimeValue);

          const newDateTime = new Date(newDate);
          const [newHours, newMinutes, newSeconds] = newTimeValue
            .split(":")
            .map(Number);
          newDateTime.setHours(newHours, newMinutes, newSeconds, 0);
          onDateChange?.(newDateTime);
          return;
        }
      }

      // Apply current time to the selected date
      if (timeValue) {
        const [hours, minutes, seconds] = timeValue.split(":").map(Number);
        const newDateTime = new Date(newDate);
        newDateTime.setHours(hours, minutes, seconds || 0, 0);
        onDateChange?.(newDateTime);
      }
    } else {
      onDateChange?.(newDate);
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = event.target.value;

    // Check if selected date is today and time is in the past
    if (selectedDate) {
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();

      if (isToday) {
        const [hours, minutes, seconds] = newTimeValue.split(":").map(Number);
        const selectedTime = new Date();
        selectedTime.setHours(hours, minutes, seconds || 0, 0);

        // If the selected time is in the past for today, don't allow it
        if (selectedTime <= today) {
          return; // Don't update the time
        }
      }
    }

    setTimeValue(newTimeValue);

    if (selectedDate && newTimeValue) {
      const [hours, minutes, seconds] = newTimeValue.split(":").map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, seconds || 0, 0);
      onDateChange?.(newDateTime);
    }
  };

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setTimeValue(format(date, "HH:mm:ss"));
    }
  }, [date]);

  const validateAndUpdateTime = React.useCallback(() => {
    if (selectedDate && timeValue) {
      const [hours, minutes, seconds] = timeValue.split(":").map(Number);
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(hours, minutes, seconds || 0, 0);

      const now = new Date();

      // If the combined date/time is in the past, update to current time
      if (combinedDateTime <= now) {
        const futureTime = new Date(now.getTime() + 60000); // Add 1 minute
        const newTimeValue = format(futureTime, "HH:mm:ss");
        setTimeValue(newTimeValue);

        const newDateTime = new Date(selectedDate);
        const [newHours, newMinutes, newSeconds] = newTimeValue
          .split(":")
          .map(Number);
        newDateTime.setHours(newHours, newMinutes, newSeconds, 0);
        onDateChange?.(newDateTime);
      }
    }
  }, [selectedDate, timeValue, onDateChange]);

  // Get minimum time for today
  const getMinTime = () => {
    if (!selectedDate) return undefined;
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (isToday) {
      // Add 1 minute to current time to ensure it's in the future
      const minTime = new Date(today.getTime() + 60000);
      return format(minTime, "HH:mm:ss");
    }
    return undefined;
  };

  return (
    <div className={cn("flex gap-3", className)}>
      <div className="flex flex-1 flex-col gap-3">
        <Label
          htmlFor="date-picker"
          className="px-1"
        >
          Date
        </Label>
        <Popover
          open={dateOpen}
          onOpenChange={(open) => {
            setDateOpen(open);
            // When closing the popover (clicking away), validate the time
            if (!open) {
              validateAndUpdateTime();
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="justify-between font-normal"
              disabled={disabled}
            >
              {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 overflow-hidden p-0"
            align="start"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
              disabled={(date) =>
                date < new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
              defaultMonth={new Date()}
              className="w-full"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <Label
          htmlFor="time-picker"
          className="px-1"
        >
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={timeValue}
          onChange={handleTimeChange}
          onBlur={validateAndUpdateTime}
          disabled={disabled}
          min={getMinTime()}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}