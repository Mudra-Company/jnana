
# Fix: Room Editor Not Syncing with Canvas Changes

## Root Cause

The `RoomEditor` component uses `useState` to initialize `width`, `height`, `name`, `roomType`, and `color` from the `room` prop. These values are set **once on mount** and never updated when the room changes on the canvas (resize/drag). When the user presses "Salva", the stale initial values overwrite the canvas changes in the database.

## Solution

Add a `useEffect` in `RoomEditor.tsx` that watches for changes to the `room` prop and syncs the local state accordingly. To avoid overwriting user edits in text fields while they're typing, we sync all properties but use `room.id` combined with dimension changes as the trigger.

### Changes to `src/components/spacesync/RoomEditor.tsx`

Add after the `useState` declarations (line 28):

```typescript
// Sync local state when room prop changes (e.g. from canvas resize/drag)
useEffect(() => {
  setName(room.name);
  setRoomType(room.roomType);
  setWidth(Math.round(room.width));
  setHeight(Math.round(room.height));
  setColor(room.color);
}, [room.id, room.width, room.height, room.x, room.y, room.name, room.roomType, room.color]);
```

This ensures that:
- When the user resizes a room on the canvas, the width/height fields update in real-time
- When the user drags a room, the state stays in sync
- When a different room is selected, all fields refresh
- Pressing "Salva" will persist the correct current values

### File Modified
- `src/components/spacesync/RoomEditor.tsx` -- add `useEffect` import and sync effect (2 line changes)

No other files need modification. This is a minimal, targeted fix.
