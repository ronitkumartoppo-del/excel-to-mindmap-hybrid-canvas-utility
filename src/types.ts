export type Priority = 'High' | 'Medium' | 'Low';
export type Status = string;

export interface CustomStatus {
  id: string;
  name: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  priority: Priority;
  status: Status;
  notes: string;
  dueDate?: string;
  collapsed?: boolean;
  x?: number;
  y?: number;
  targetX?: number;
  targetY?: number;
  createdAt?: number;
  opacity?: number;
  subtreeHeight?: number;
  fillColor?: string;
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  borderStyle?: 'solid' | 'dashed' | 'none';
  borderColor?: string;
  isLocked?: boolean;
  manualBlocked?: boolean;
  password?: string;
  lockedAt?: number;
  lockDependencies?: string[];
  linkedNodeIds?: string[];
  blockedBy?: string[];
  progress?: number;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface Dependency {
  id: string;
  predecessorId: string;
  successorId: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  canvasBg: string;
  gridLineColor: string;
  nodeBg: string;
  nodeBorder: string;
  nodeText: string;
  nodeSelectedBorder: string;
  connectorColor: string;
  accentColor: string;
  cardBg: string;
  sidebarBg: string;
  isDark: boolean;
  isSketch?: boolean;
  priorityColors: {
    High: string;
    Medium: string;
    Low: string;
  };
  statusColors: Record<string, string>;
}

export interface TemplateConfig {
  id: string;
  name: string;
  industry: 'Tech & AI' | 'Marketing & Brand' | 'Business & Ops' | 'Productivity';
  description: string;
  nodes: {
    id: string;
    label: string;
    parentId: string | null;
    priority: Priority;
    status: Status;
    notes: string;
  }[];
}
