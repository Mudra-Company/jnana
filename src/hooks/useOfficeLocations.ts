import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OfficeLocation } from '@/types/spacesync';
import { toast } from '@/hooks/use-toast';

export const useOfficeLocations = () => {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = useCallback(async (companyId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('office_locations')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching office locations:', error);
      toast({ title: 'Errore', description: 'Impossibile caricare le sedi', variant: 'destructive' });
    } else {
      setLocations((data || []).map((d: any) => ({
        id: d.id,
        companyId: d.company_id,
        name: d.name,
        address: d.address ?? undefined,
        buildingName: d.building_name ?? undefined,
        floorNumber: d.floor_number ?? undefined,
        sortOrder: d.sort_order,
        canvasWidth: d.canvas_width,
        canvasHeight: d.canvas_height,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })));
    }
    setIsLoading(false);
  }, []);

  const createLocation = useCallback(async (companyId: string, name: string, address?: string, buildingName?: string, floorNumber?: number) => {
    const { data, error } = await supabase
      .from('office_locations')
      .insert({
        company_id: companyId,
        name,
        address: address || null,
        building_name: buildingName || null,
        floor_number: floorNumber ?? null,
        sort_order: locations.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile creare la sede', variant: 'destructive' });
      return null;
    }
    await fetchLocations(companyId);
    return data;
  }, [locations.length, fetchLocations]);

  const updateLocation = useCallback(async (id: string, updates: Partial<Pick<OfficeLocation, 'name' | 'address' | 'buildingName' | 'floorNumber'>>, companyId: string) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.buildingName !== undefined) dbUpdates.building_name = updates.buildingName;
    if (updates.floorNumber !== undefined) dbUpdates.floor_number = updates.floorNumber;

    const { error } = await supabase
      .from('office_locations')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare la sede', variant: 'destructive' });
      return false;
    }
    await fetchLocations(companyId);
    return true;
  }, [fetchLocations]);

  const deleteLocation = useCallback(async (id: string, companyId: string) => {
    const { error } = await supabase
      .from('office_locations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare la sede', variant: 'destructive' });
      return false;
    }
    await fetchLocations(companyId);
    return true;
  }, [fetchLocations]);

  return { locations, isLoading, fetchLocations, createLocation, updateLocation, deleteLocation };
};
