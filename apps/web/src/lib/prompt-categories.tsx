/**
 * Category utilities for agent prompt templates.
 *
 * Provides icon and color mapping for different template categories,
 * enabling visual categorization and intuitive recognition.
 */

import {
  Search,
  FileText,
  Code,
  Database,
  MessageSquare,
  Headphones,
  Users,
  Zap,
  FileSearch,
  GitBranch,
  Settings,
  TestTube,
  Workflow,
  Brain,
} from "lucide-react";

/**
 * Category metadata including icon and color
 */
export interface CategoryStyle {
  icon: React.ComponentType<{ className?: string }>;
  color: string; // Tailwind color class
  bgColor: string; // Tailwind bg color class
}

/**
 * Map tool categories to visual styles
 */
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  // Search and retrieval
  web_search: {
    icon: Search,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  content_extraction: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  semantic_search: {
    icon: FileSearch,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  rag_queries: {
    icon: Brain,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },

  // Code and development
  code_discovery: {
    icon: Code,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  file_operations: {
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  development_tools: {
    icon: GitBranch,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  repository_analysis: {
    icon: GitBranch,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },

  // Agent management and orchestration
  agent_management: {
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  task_orchestration: {
    icon: Workflow,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  agent_orchestration: {
    icon: Workflow,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  multi_agent_systems: {
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },

  // Communication
  inter_agent_communication: {
    icon: MessageSquare,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
  },
  conversation_routing: {
    icon: MessageSquare,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
  },

  // Customer support and sales
  customer_support: {
    icon: Headphones,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  sales_automation: {
    icon: Zap,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },

  // Data and knowledge
  knowledge_graph: {
    icon: Database,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
  },
  knowledge_graphs: {
    icon: Database,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
  },
  documentation_retrieval: {
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
  },

  // Testing and quality
  testing: {
    icon: TestTube,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },
  quality_assurance: {
    icon: TestTube,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },

  // Configuration and utilities
  automation: {
    icon: Zap,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  utilities: {
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950",
  },
  system_introspection: {
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950",
  },
};

/**
 * Default style for uncategorized templates
 */
const DEFAULT_STYLE: CategoryStyle = {
  icon: FileText,
  color: "text-slate-600",
  bgColor: "bg-slate-50 dark:bg-slate-950",
};

/**
 * Get visual style for a tool category.
 *
 * @param categories - Array of category strings from tool metadata
 * @returns CategoryStyle with icon and colors
 */
export function getCategoryStyle(categories?: string[]): CategoryStyle {
  if (!categories || categories.length === 0) {
    return DEFAULT_STYLE;
  }

  // Check each category and return first match
  for (const category of categories) {
    const normalized = category.toLowerCase().replace(/[^a-z_]/g, "_");
    if (CATEGORY_STYLES[normalized]) {
      return CATEGORY_STYLES[normalized];
    }
  }

  return DEFAULT_STYLE;
}

/**
 * Get primary category from an array of categories.
 * Used for display purposes when showing a single category label.
 *
 * @param categories - Array of category strings
 * @returns Primary category string (formatted)
 */
export function getPrimaryCategory(categories?: string[]): string {
  if (!categories || categories.length === 0) {
    return "General";
  }

  // Priority order for primary category selection
  const priorityOrder = [
    "agent_management",
    "agent_orchestration",
    "web_search",
    "code_discovery",
    "customer_support",
    "sales_automation",
    "knowledge_graph",
    "testing",
  ];

  for (const priority of priorityOrder) {
    if (categories.includes(priority)) {
      return formatCategoryName(priority);
    }
  }

  // Return first category if no priority match
  return formatCategoryName(categories[0]);
}

/**
 * Format category name for display.
 *
 * @param category - Raw category string (e.g., "web_search")
 * @returns Formatted string (e.g., "Web Search")
 */
export function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
