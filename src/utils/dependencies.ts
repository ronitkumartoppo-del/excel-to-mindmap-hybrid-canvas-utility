import { MindMapNode, CustomStatus } from '../types';
import { isNodeDone } from './lockHelpers';

export const isNodeLocked = (
  node: MindMapNode,
  allNodes: MindMapNode[],
  customStatuses?: CustomStatus[]
): boolean => {
  if (!node) return false;
  const rawDeps = Array.from(new Set([...(node.lockDependencies || []), ...(node.blockedBy || [])].map(String)));
  if (rawDeps.length === 0) return false;
  const validDeps = rawDeps.filter((id) => allNodes.some((n) => String(n.id) === id));
  if (validDeps.length === 0) return false;
  return validDeps.some((id) => {
    const depNode = allNodes.find((n) => String(n.id) === id);
    if (!depNode) return false;
    return !isNodeDone(depNode, allNodes);
  });
};

export const getDependencyProgress = (
  node: MindMapNode,
  allNodes: MindMapNode[],
  customStatuses?: CustomStatus[]
) => {
  const rawDeps = Array.from(new Set([...(node.lockDependencies || []), ...(node.blockedBy || [])].map(String)));
  if (rawDeps.length === 0) return { done: 0, total: 0, percentage: 100 };
  const validDeps = rawDeps.map((id) => {
    const found = allNodes.find((n) => String(n.id) === id);
    if (found) return found;
    return { id, label: `[Removed Task #${id}]`, isDeleted: true, status: 'Done' };
  });
  const total = validDeps.length;
  const done = validDeps.filter((depNode) => isNodeDone(depNode, allNodes)).length;
  return { done, total, percentage: Math.round((done / total) * 100) };
};

export const wouldCauseCircularDependency = (
  predecessorId: string,
  successorId: string,
  allNodes: MindMapNode[]
): boolean => {
  if (!predecessorId || !successorId || predecessorId === successorId) return true;
  const visited = new Set<string>();
  const queue: string[] = [predecessorId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === successorId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    const currentNode = allNodes.find((n) => String(n.id) === currentId);
    if (currentNode) {
      const deps = Array.from(new Set([...(currentNode.lockDependencies || []), ...(currentNode.blockedBy || [])].map(String)));
      for (const blockedId of deps) {
        if (!visited.has(blockedId)) queue.push(blockedId);
      }
    }
  }
  return false;
};
