import { useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { OrgNode } from '../../types';
import type { Json } from '../integrations/supabase/types';

interface DbOrgNode {
  id: string;
  company_id: string;
  name: string;
  type: 'root' | 'department' | 'team';
  parent_node_id: string | null;
  is_cultural_driver: boolean | null;
  target_profile: Json;
  sort_order: number | null;
}

// Convert TargetProfile to Json-compatible format
const targetProfileToJson = (tp: any): Json => {
  if (!tp) return {};
  return {
    hardSkills: tp.hardSkills || [],
    softSkills: tp.softSkills || [],
    seniority: tp.seniority || 'Mid',
  } as Json;
};

// Convert frontend OrgNode to DB format
const toDbNode = (
  node: OrgNode, 
  companyId: string, 
  parentNodeId: string | null = null,
  sortOrder: number = 0
): Omit<DbOrgNode, 'id'> & { id?: string } => ({
  id: node.id.startsWith('n_') ? undefined : node.id, // Only include ID if it's a real UUID
  company_id: companyId,
  name: node.name,
  type: node.type as 'root' | 'department' | 'team',
  parent_node_id: parentNodeId,
  is_cultural_driver: node.isCulturalDriver || false,
  target_profile: targetProfileToJson(node.targetProfile),
  sort_order: sortOrder,
});

// Flatten tree to array for comparison/insertion
const flattenTree = (
  node: OrgNode, 
  companyId: string, 
  parentId: string | null = null, 
  sortOrder: number = 0
): Array<Omit<DbOrgNode, 'id'> & { id?: string; tempId?: string }> => {
  const result: Array<Omit<DbOrgNode, 'id'> & { id?: string; tempId?: string }> = [];
  
  const dbNode = toDbNode(node, companyId, parentId, sortOrder);
  const isNewNode = node.id.startsWith('n_');
  
  result.push({
    ...dbNode,
    tempId: isNewNode ? node.id : undefined,
  });
  
  node.children.forEach((child, index) => {
    result.push(...flattenTree(child, companyId, isNewNode ? node.id : node.id, index));
  });
  
  return result;
};

export const useOrgNodes = () => {
  // Create a new org node
  const createOrgNode = async (node: {
    company_id: string;
    name: string;
    type: 'root' | 'department' | 'team';
    parent_node_id: string | null;
    is_cultural_driver?: boolean;
    target_profile?: Json;
    sort_order?: number;
  }) => {
    const insertData = {
      company_id: node.company_id,
      name: node.name,
      type: node.type,
      parent_node_id: node.parent_node_id,
      is_cultural_driver: node.is_cultural_driver ?? false,
      target_profile: (node.target_profile || {}) as Json,
      sort_order: node.sort_order ?? 0,
    };
    
    const { data, error } = await supabase
      .from('org_nodes')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('[useOrgNodes] Error creating node:', error);
    }
    return { data, error };
  };

  // Update an existing node
  const updateOrgNode = async (nodeId: string, updates: {
    name?: string;
    is_cultural_driver?: boolean;
    target_profile?: Json;
    sort_order?: number;
    parent_node_id?: string | null;
  }) => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.is_cultural_driver !== undefined) updateData.is_cultural_driver = updates.is_cultural_driver;
    if (updates.target_profile !== undefined) updateData.target_profile = updates.target_profile;
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
    if (updates.parent_node_id !== undefined) updateData.parent_node_id = updates.parent_node_id;
    
    const { data, error } = await supabase
      .from('org_nodes')
      .update(updateData)
      .eq('id', nodeId)
      .select()
      .single();
    
    if (error) {
      console.error('[useOrgNodes] Error updating node:', error);
    }
    return { data, error };
  };

  // Delete a node (cascade deletes children via DB constraint or we handle manually)
  const deleteOrgNode = async (nodeId: string) => {
    // First delete all children recursively
    const deleteChildrenRecursively = async (parentId: string) => {
      const { data: children } = await supabase
        .from('org_nodes')
        .select('id')
        .eq('parent_node_id', parentId);
      
      if (children && children.length > 0) {
        for (const child of children) {
          await deleteChildrenRecursively(child.id);
        }
      }
      
      await supabase.from('org_nodes').delete().eq('id', parentId);
    };
    
    await deleteChildrenRecursively(nodeId);
    
    return { error: null };
  };

  // Fetch all nodes for a company
  const fetchOrgNodes = useCallback(async (companyId: string) => {
    const { data, error } = await supabase
      .from('org_nodes')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');
    
    if (error) {
      console.error('[useOrgNodes] Error fetching nodes:', error);
    }
    return { data, error };
  }, []);

  // Sync entire tree structure to database
  // This handles create, update, and delete in one operation
  const syncTreeToDatabase = async (
    companyId: string,
    newTree: OrgNode,
    existingNodeIds: string[]
  ): Promise<{ success: boolean; newIdMap: Record<string, string> }> => {
    const newIdMap: Record<string, string> = {};
    
    // Recursive function to sync a node and its children
    const syncNode = async (
      node: OrgNode,
      parentDbId: string | null
    ): Promise<boolean> => {
      const isNewNode = node.id.startsWith('n_');
      let dbNodeId: string;
      
      if (isNewNode) {
        // Create new node
        const { data, error } = await createOrgNode({
          company_id: companyId,
          name: node.name,
          type: node.type as 'root' | 'department' | 'team',
          parent_node_id: parentDbId,
          is_cultural_driver: node.isCulturalDriver,
          target_profile: targetProfileToJson(node.targetProfile),
        });
        
        if (error || !data) {
          console.error('[useOrgNodes] Failed to create node:', node.name);
          return false;
        }
        
        dbNodeId = data.id;
        newIdMap[node.id] = dbNodeId;
      } else {
        // Update existing node
        dbNodeId = node.id;
        const { error } = await updateOrgNode(node.id, {
          name: node.name,
          is_cultural_driver: node.isCulturalDriver,
          target_profile: targetProfileToJson(node.targetProfile),
          parent_node_id: parentDbId,
        });
        
        if (error) {
          console.error('[useOrgNodes] Failed to update node:', node.name);
          return false;
        }
      }
      
      // Sync children
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const success = await syncNode(child, dbNodeId);
        if (!success) return false;
      }
      
      return true;
    };
    
    // Collect all node IDs in the new tree
    const collectNodeIds = (node: OrgNode): string[] => {
      const ids: string[] = [];
      if (!node.id.startsWith('n_')) {
        ids.push(node.id);
      }
      node.children.forEach(child => {
        ids.push(...collectNodeIds(child));
      });
      return ids;
    };
    
    const newTreeNodeIds = collectNodeIds(newTree);
    
    // Find nodes to delete (exist in DB but not in new tree)
    const nodesToDelete = existingNodeIds.filter(id => !newTreeNodeIds.includes(id));
    
    // Delete removed nodes
    for (const nodeId of nodesToDelete) {
      await deleteOrgNode(nodeId);
    }
    
    // Sync the tree
    const success = await syncNode(newTree, null);
    
    return { success, newIdMap };
  };

  return { 
    createOrgNode, 
    updateOrgNode, 
    deleteOrgNode, 
    fetchOrgNodes,
    syncTreeToDatabase 
  };
};
