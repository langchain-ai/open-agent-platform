import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useThreadsContext } from "../contexts/ThreadContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { INBOX_PARAM, LIMIT_PARAM, OFFSET_PARAM } from "../constants";

function DisplayLimitSelect() {
  const [fetchLimitParam, setFetchLimitParam] = useQueryState(
    LIMIT_PARAM,
    parseAsInteger.withDefault(10),
  );
  const { loading } = useThreadsContext();
  const fetchLimitOptions = ["10", "25", "50", "100"];

  return (
    <Select
      disabled={loading}
      value={fetchLimitParam.toString()}
      onValueChange={async (v) => {
        await setFetchLimitParam(Number(v));
      }}
    >
      <SelectTrigger className="h-8 w-[180px]">
        <SelectValue>{fetchLimitParam}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Display Limit</SelectLabel>
          {fetchLimitOptions.map((option) => (
            <SelectItem
              key={`fetch-limit-${option}`}
              value={option}
            >
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function Pagination() {
  // Get individual parameters
  const [offsetParam, setOffsetParam] = useQueryState(
    OFFSET_PARAM,
    parseAsInteger.withDefault(0),
  );

  const [limitParam] = useQueryState(
    LIMIT_PARAM,
    parseAsInteger.withDefault(10),
  );

  const [selectedInbox] = useQueryState(
    INBOX_PARAM,
    parseAsString.withDefault("interrupted"),
  );

  const { hasMoreThreads, loading } = useThreadsContext();

  const isPreviousDisabled = offsetParam === 0 || loading;
  const isNextDisabled = !hasMoreThreads || loading;

  const handleClickNext = async () => {
    if (!selectedInbox) {
      toast.error("No inbox selected");
      return;
    }

    const newOffset = offsetParam + limitParam;
    await setOffsetParam(newOffset);
  };

  const handleClickPrevious = async () => {
    if (!selectedInbox) {
      toast.error("No inbox selected");
      return;
    }

    const newOffset = Math.max(offsetParam - limitParam, 0);
    await setOffsetParam(newOffset);
  };

  return (
    <div className="flex items-center gap-2">
      <DisplayLimitSelect />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          className="flex items-center gap-1"
          variant="outline"
          disabled={isPreviousDisabled}
          onClick={handleClickPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        <Button
          size="sm"
          className="flex items-center gap-1"
          variant="outline"
          disabled={isNextDisabled}
          onClick={handleClickNext}
        >
          <ChevronRight className="h-4 w-4" />
          <span>Next</span>
        </Button>
      </div>
    </div>
  );
}
