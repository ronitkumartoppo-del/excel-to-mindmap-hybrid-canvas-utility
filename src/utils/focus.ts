import { MindMapNode } from '../types';

export const isNodeOverdueOrToday = (node: MindMapNode): boolean => {
  if (!node.dueDate) return false;
  const due = new Date(node.dueDate);
  if (isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  return dueDay.getTime() <= today.getTime();
};

export const isNodeCompleted = (node: MindMapNode): boolean => {
  return String(node.status || '').toUpperCase().trim() === 'DONE';
};

export const isNodeInFocusCriteria = (node: MindMapNode): boolean => {
  const priorityUpper = String(node.priority || '').toUpperCase().trim();
  const statusUpper = String(node.status || '').toUpperCase().trim();
  if (priorityUpper === 'HIGH') return true;
  if (statusUpper === 'IN PROGRESS' || statusUpper === 'IN_PROGRESS') return true;
  if (node.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(node.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (!isNaN(dueDate.getTime()) && dueDate.getTime() <= today.getTime()) return true;
  }
  return false;
};

export const getVisibleNodeIdsInFocusMode = (allNodes: MindMapNode[]): Set<string> => {
  const visibleIds = new Set<string>();
  const baseFocusNodes = allNodes.filter(isNodeInFocusCriteria);
  const addNodeAndAncestors = (nodeId: string) => {
    let currentId: string | null = nodeId;
    while (currentId) {
      if (visibleIds.has(currentId)) break;
      visibleIds.add(currentId);
      const node = allNodes.find(n => n.id === currentId);
      currentId = node ? node.parentId : null;
    }
  };
  for (const node of baseFocusNodes) addNodeAndAncestors(node.id);
  if (visibleIds.size > 0) {
    const rootNode = allNodes.find(n => n.parentId === null);
    if (rootNode) visibleIds.add(rootNode.id);
  }
  return visibleIds;
};

export const shouldNodeBeVisible = (
  node: MindMapNode,
  allNodes: MindMapNode[],
  isFocusMode: boolean
): boolean => {
  if (!isFocusMode) return true;
  return getVisibleNodeIdsInFocusMode(allNodes).has(node.id);
};
