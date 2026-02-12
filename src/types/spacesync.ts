export type RoomType = 'office' | 'meeting' | 'common' | 'other';

export interface OfficeLocation {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  buildingName?: string;
  floorNumber?: number;
  sortOrder: number;
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeRoom {
  id: string;
  locationId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roomType: RoomType;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeDesk {
  id: string;
  roomId: string;
  label: string;
  x: number;
  y: number;
  companyMemberId?: string;
  companyRoleId?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data (not stored in DB)
  assigneeName?: string;
  assigneeJobTitle?: string;
  roleName?: string;
}

export type CanvasMode = 'select' | 'draw-room' | 'place-desk';

export type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface ResizingRoom {
  roomId: string;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  originalRoom: { x: number; y: number; width: number; height: number };
}

export interface DraggingRoom {
  roomId: string;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
}

export interface CanvasState {
  mode: CanvasMode;
  zoom: number;
  panX: number;
  panY: number;
  selectedRoomId?: string;
  selectedDeskId?: string;
  drawingRect?: { startX: number; startY: number; currentX: number; currentY: number };
}
