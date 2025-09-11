import * as React from "react";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface AcceptScheduleButtonProps {
  onAccept: () => void;
  onSchedule: (scheduledDate: Date) => void;
  acceptDisabled?: boolean;
  scheduleDisabled?: boolean;
  className?: string;
  acceptText?: string;
  scheduleText?: string;
}

export function AcceptScheduleButton({
  onAccept,
  onSchedule,
  acceptDisabled = false,
  scheduleDisabled = false,
  className,
  acceptText = "Accept",
  scheduleText = "Schedule",
}: AcceptScheduleButtonProps) {
  const [scheduledDate, setScheduledDate] = React.useState<Date>();
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);

  const handleScheduleConfirm = () => {
    if (scheduledDate) {
      onSchedule(scheduledDate);
      setIsScheduleOpen(false);
      setScheduledDate(undefined);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      {/* Accept Button */}
      <Button
        onClick={onAccept}
        disabled={acceptDisabled}
        className="rounded-r-none border-r-0 bg-[#2F6868] font-medium text-white hover:bg-[#2F6868]/90"
        size="sm"
      >
        {acceptText}
      </Button>

      {/* Schedule Dropdown */}
      <Popover
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={scheduleDisabled}
            className="rounded-l-none border-l-0 bg-white px-3 font-medium text-gray-700 hover:bg-gray-50 border-gray-300"
            size="sm"
          >
            <span className="mr-1">{scheduleText}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="end"
        >
          <div className="space-y-4 p-4">
            <DateTimePicker
              date={scheduledDate}
              setDate={setScheduledDate}
              placeholder="Select date and time"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsScheduleOpen(false);
                  setScheduledDate(undefined);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleScheduleConfirm}
                disabled={!scheduledDate}
                className="bg-[#2F6868] text-white hover:bg-[#2F6868]/90"
              >
                {scheduleText}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
