import { useState, forwardRef, ForwardedRef } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  History,
  EllipsisVertical,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarButtonsProps {
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  configOpen: boolean;
  setConfigOpen: (open: boolean) => void;
  className?: string;
}

export const SidebarButtons = forwardRef<HTMLDivElement, SidebarButtonsProps>(
  (
    { historyOpen, setHistoryOpen, configOpen, setConfigOpen, className },
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    const isOpen = historyOpen || configOpen;

    const handleConfigClick = () => {
      setConfigOpen(true);
      setHistoryOpen(false);
    };

    const handleHistoryClick = () => {
      setHistoryOpen(true);
      setConfigOpen(false);
    };

    const closeAll = () => {
      setConfigOpen(false);
      setHistoryOpen(false);
    };

    const isSidebarOpen = historyOpen || configOpen;

    return (
      <motion.div
        ref={ref}
        className={cn(
          "fixed top-4 z-50 transition-all duration-300 ease-in-out",
          isOpen ? "right-[theme(spacing.80)] md:right-[37rem]" : "right-4",
          className,
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="relative flex flex-col items-end">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "bg-background hover:bg-muted z-10 rounded-full shadow-lg",
              isSidebarOpen ? "cursor-pointer" : "hover:bg-background",
            )}
            onClick={() => {
              if (!isSidebarOpen) return;
              // Sidebar is open, clicking this will close any open sidebar
              closeAll();
            }}
          >
            {isSidebarOpen ? (
              <ChevronRight className="size-5" />
            ) : (
              <EllipsisVertical className="size-5" />
            )}
          </Button>

          <motion.div
            className="absolute top-full right-0 mt-2 mb-1 flex flex-col items-end space-y-2"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : -10,
              height: isHovered ? "auto" : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <Button
              variant="outline"
              size="icon"
              className="bg-background hover:bg-muted rounded-full shadow-md hover:cursor-pointer"
              onClick={handleConfigClick}
              aria-label="Open Configuration"
            >
              <Settings className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-background hover:bg-muted rounded-full shadow-md hover:cursor-pointer"
              onClick={handleHistoryClick}
              aria-label="Open History"
            >
              <History className="size-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  },
);

SidebarButtons.displayName = "SidebarButtons";
