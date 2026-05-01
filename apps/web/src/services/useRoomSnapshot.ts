import { useEffect, useState } from "react";
import { onRoomDeleted, onSnapshot, subscribeRoom, type RoomSnapshot } from "./room-api";

export function useRoomSnapshot(
  roomId: string | undefined,
  userId: string | undefined,
): { snapshot: RoomSnapshot | null; deleted: boolean } {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    setDeleted(false);
    const offSnap = onSnapshot((s) => {
      if (s.id === roomId) setSnapshot(s);
    });
    const offDel = onRoomDeleted((p) => {
      if (p.roomId === roomId) setDeleted(true);
    });
    subscribeRoom({ roomId, userId }).catch(() => undefined);
    return () => {
      offSnap();
      offDel();
    };
  }, [roomId, userId]);

  return { snapshot, deleted };
}
