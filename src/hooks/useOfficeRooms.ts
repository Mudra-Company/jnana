import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OfficeRoom, RoomType } from '@/types/spacesync';
import { toast } from '@/hooks/use-toast';

export const useOfficeRooms = () => {
  const [rooms, setRooms] = useState<OfficeRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRooms = useCallback(async (locationId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('office_rooms')
      .select('*')
      .eq('location_id', locationId);

    if (error) {
      console.error('Error fetching rooms:', error);
    } else {
      setRooms((data || []).map((d: any) => ({
        id: d.id,
        locationId: d.location_id,
        name: d.name,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        color: d.color || '#e2e8f0',
        roomType: d.room_type as RoomType,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })));
    }
    setIsLoading(false);
  }, []);

  const createRoom = useCallback(async (locationId: string, room: { name: string; x: number; y: number; width: number; height: number; roomType?: RoomType; color?: string }) => {
    const { data, error } = await supabase
      .from('office_rooms')
      .insert({
        location_id: locationId,
        name: room.name,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        room_type: room.roomType || 'office',
        color: room.color || '#e2e8f0',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile creare la stanza', variant: 'destructive' });
      return null;
    }
    await fetchRooms(locationId);
    return data;
  }, [fetchRooms]);

  const updateRoom = useCallback(async (id: string, updates: Partial<OfficeRoom>, locationId: string) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.x !== undefined) dbUpdates.x = updates.x;
    if (updates.y !== undefined) dbUpdates.y = updates.y;
    if (updates.width !== undefined) dbUpdates.width = updates.width;
    if (updates.height !== undefined) dbUpdates.height = updates.height;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.roomType !== undefined) dbUpdates.room_type = updates.roomType;

    const { error } = await supabase
      .from('office_rooms')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare la stanza', variant: 'destructive' });
      return false;
    }
    await fetchRooms(locationId);
    return true;
  }, [fetchRooms]);

  const deleteRoom = useCallback(async (id: string, locationId: string) => {
    const { error } = await supabase
      .from('office_rooms')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare la stanza', variant: 'destructive' });
      return false;
    }
    await fetchRooms(locationId);
    return true;
  }, [fetchRooms]);

  return { rooms, isLoading, fetchRooms, createRoom, updateRoom, deleteRoom };
};
