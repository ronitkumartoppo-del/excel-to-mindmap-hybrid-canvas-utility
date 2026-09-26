import { MindMapNode } from '../types';
import { isDescendant } from './layout';

export function collectDescendantIds(rootId: string, nodes: MindMapNode[]): Set<string> {
  const ids = new Set<string>();
  const walk = (id: string) => {
    nodes.forEach((n) => {
      if (n.parentId === id && !ids.has(n.id)) {
        ids.add(n.id);
        walk(n.id);
      }
    });
  };
  walk(rootId);
  return ids;
}

export function wouldCreateParentCycle(nodeId: string, parentId: string | null, nodes: MindMapNode[]): boolean {
  if (!parentId) return false;
  if (parentId === nodeId) return true;
  return isDescendant(nodeId, parentId, nodes);
}

export function reparentNode(nodes: MindMapNode[], nodeId: string, parentId: string | null): { nodes: MindMapNode[]; error?: string } {
  const target = nodes.find((n) => n.id === nodeId);
  if (!target) return { nodes, error: 'Node not found.' };
  if (parentId && !nodes.some((n) => n.id === parentId)) {
    return { nodes, error: 'Parent ID does not exist.' };
  }
  if (wouldCreateParentCycle(nodeId, parentId, nodes)) {
    return { nodes, error: 'That parent would create a circular hierarchy.' };
  }
  return {
    nodes: nodes.map((n) => (n.id === nodeId ? { ...n, parentId } : n)),
  };
}

export function assertTreeIntegrity(nodes: MindMapNode[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<string>();
  nodes.forEach((n) => {
    if (!n.id) errors.push('Missing ID');
    if (seen.has(n.id)) errors.push(`Duplicate ID ${n.id}`);
    seen.add(n.id);
  });
  nodes.forEach((n) => {
    if (n.parentId && !seen.has(n.parentId)) {
      errors.push(`Missing parent ${n.parentId} for ${n.id}`);
    }
    if (n.parentId && wouldCreateParentCycle(n.id, n.parentId, nodes)) {
      errors.push(`Cycle at ${n.id}`);
    }
  });
  return { ok: errors.length === 0, errors };
}

export function nodeMatchesQuery(node: MindMapNode, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return false;
  if (String(node.label || '').toLowerCase().includes(query)) return true;
  if (String(node.notes || '').toLowerCase().includes(query)) return true;
  if (String(node.status || '').toLowerCase().includes(query)) return true;
  if (String(node.id || '').toLowerCase() === query) return true;
  if ((node.tags || []).some((tag) => tag.toLowerCase().includes(query))) return true;
  if (node.metadata && Object.values(node.metadata).some((v) => String(v).toLowerCase().includes(query))) return true;
  return false;
}
