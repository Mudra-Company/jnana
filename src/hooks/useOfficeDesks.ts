import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { OfficeDesk } from '@/types/spacesync';
import { toast } from '@/hooks/use-toast';

export const useOfficeDesks = () => {
  const [desks, setDesks] = useState<OfficeDesk[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDesks = useCallback(async (locationId: string) => {
    setIsLoading(true);
    const { data: roomsData } = await supabase
      .from('office_rooms')
      .select('id')
      .eq('location_id', locationId);

    if (!roomsData || roomsData.length === 0) {
      setDesks([]);
      setIsLoading(false);
      return;
    }

    const roomIds = roomsData.map((r: any) => r.id);
    const { data, error } = await supabase
      .from('office_desks')
      .select(`
        *,
        member:company_member_id(
          id,
          placeholder_first_name,
          placeholder_last_name,
          job_title,
          user_id,
          profiles:user_id(first_name, last_name)
        ),
        role:company_role_id(id, title)
      `)
      .in('room_id', roomIds);

    if (error) {
      console.error('Error fetching desks:', error);
    } else {
      setDesks((data || []).map((d: any) => {
        const member = d.member as any;
        let assigneeName: string | undefined;
        let assigneeJobTitle: string | undefined;

        if (member) {
          if (member.profiles) {
            assigneeName = `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim();
          } else {
            assigneeName = `${member.placeholder_first_name || ''} ${member.placeholder_last_name || ''}`.trim();
          }
          assigneeJobTitle = member.job_title || undefined;
        }

        const role = d.role as any;

        return {
          id: d.id,
          roomId: d.room_id,
          label: d.label,
          x: d.x,
          y: d.y,
          companyMemberId: d.company_member_id ?? undefined,
          companyRoleId: d.company_role_id ?? undefined,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          assigneeName: assigneeName || undefined,
          assigneeJobTitle,
          roleName: role?.title || undefined,
        };
      }));
    }
    setIsLoading(false);
  }, []);

  const createDesk = useCallback(async (roomId: string, desk: { label: string; x: number; y: number }, locationId: string) => {
    const { data, error } = await supabase
      .from('office_desks')
      .insert({
        room_id: roomId,
        label: desk.label,
        x: desk.x,
        y: desk.y,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile creare la scrivania', variant: 'destructive' });
      return null;
    }
    await fetchDesks(locationId);
    return data;
  }, [fetchDesks]);

  const updateDesk = useCallback(async (id: string, updates: Partial<Pick<OfficeDesk, 'label' | 'x' | 'y' | 'companyMemberId' | 'companyRoleId' | 'roomId'>>, locationId: string) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.x !== undefined) dbUpdates.x = updates.x;
    if (updates.y !== undefined) dbUpdates.y = updates.y;
    if (updates.roomId !== undefined) dbUpdates.room_id = updates.roomId;
    if (updates.companyMemberId !== undefined) dbUpdates.company_member_id = updates.companyMemberId || null;
    if (updates.companyRoleId !== undefined) dbUpdates.company_role_id = updates.companyRoleId || null;

    const { error } = await supabase
      .from('office_desks')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile aggiornare la scrivania', variant: 'destructive' });
      return false;
    }
    await fetchDesks(locationId);
    return true;
  }, [fetchDesks]);

  const deleteDesk = useCallback(async (id: string, locationId: string) => {
    const { error } = await supabase
      .from('office_desks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare la scrivania', variant: 'destructive' });
      return false;
    }
    await fetchDesks(locationId);
    return true;
  }, [fetchDesks]);

  const fetchAllDesks = useCallback(async (companyId: string) => {
    const { data: allLocations } = await supabase
      .from('office_locations')
      .select('id, name, address, floor_number')
      .eq('company_id', companyId);

    if (!allLocations || allLocations.length === 0) return [];

    const locationIds = allLocations.map((l: any) => l.id);
    const { data: allRooms } = await supabase
      .from('office_rooms')
      .select('id, location_id, x, y')
      .in('location_id', locationIds);

    if (!allRooms || allRooms.length === 0) return [];

    const roomIds = allRooms.map((r: any) => r.id);
    const { data: allDesksData } = await supabase
      .from('office_desks')
      .select(`
        id, room_id, label, x, y, company_member_id,
        member:company_member_id(
          id, placeholder_first_name, placeholder_last_name, user_id,
          profiles:user_id(first_name, last_name)
        )
      `)
      .in('room_id', roomIds);

    if (!allDesksData) return [];

    const roomMap = new Map(allRooms.map((r: any) => [r.id, r]));
    const locMap = new Map(allLocations.map((l: any) => [l.id, l]));

    const result: Array<{
      deskId: string; memberId: string; memberName: string;
      locationId: string; locationName: string; locationAddress?: string;
      floorNumber?: number; roomId: string; absX: number; absY: number;
    }> = [];

    for (const d of allDesksData as any[]) {
      if (!d.company_member_id) continue;
      const room = roomMap.get(d.room_id);
      if (!room) continue;
      const loc = locMap.get(room.location_id);
      if (!loc) continue;

      const member = d.member as any;
      let name = '';
      if (member?.profiles) {
        name = `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim();
      } else if (member) {
        name = `${member.placeholder_first_name || ''} ${member.placeholder_last_name || ''}`.trim();
      }

      result.push({
        deskId: d.id,
        memberId: d.company_member_id,
        memberName: name || d.label,
        locationId: loc.id,
        locationName: loc.name,
        locationAddress: loc.address ?? undefined,
        floorNumber: loc.floor_number ?? undefined,
        roomId: d.room_id,
        absX: room.x + d.x + 16,
        absY: room.y + d.y + 16,
      });
    }

    return result;
  }, []);

  return { desks, isLoading, fetchDesks, fetchAllDesks, createDesk, updateDesk, deleteDesk };
};
