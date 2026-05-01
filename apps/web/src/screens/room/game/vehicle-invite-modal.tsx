import React, { useCallback } from "react";
import styled from "styled-components";
import { Button, Modal } from "../../../components";
import { TURN_STAGES, findCardByKey } from "../../../utils";
import { respondVehicleInvite, type RoomSnapshot } from "../../../services";

interface VehicleInviteModalProps {
  myUserId: string;
  room: RoomSnapshot;
  roomId: string;
}

const VehicleInviteModal = ({ myUserId, room, roomId }: VehicleInviteModalProps) => {
  const turn = room.turn;
  const cells = turn?.availableCells ?? [];
  const isInvite = turn?.stage === TURN_STAGES.VEHICLE_INVITE;
  const inviteeId = cells[2];
  const showFor = isInvite && inviteeId === myUserId;

  const respond = useCallback(
    (accept: boolean) => {
      respondVehicleInvite(roomId, myUserId, accept).catch((err) =>
        console.error("[vehicle:respond]", err),
      );
    },
    [roomId, myUserId],
  );

  if (!showFor) return null;

  const driver = turn ? room.users[turn.currentUserId] : null;
  const vehicleName = findCardByKey(cells[0])?.name ?? "veículo";

  return (
    <Modal>
      <Label>
        🚗 {driver?.username ?? "O motorista"} está oferecendo carona em{" "}
        <strong>{vehicleName}</strong>!
      </Label>
      <Row>
        <Button onClick={() => respond(true)}>Aceitar</Button>
        <Button size="small" onClick={() => respond(false)}>
          Recusar
        </Button>
      </Row>
    </Modal>
  );
};

export default VehicleInviteModal;

const Label = styled.label`
  width: 80vw;
  max-width: 600px;
  text-align: center;
  font-size: 1.3rem;
  margin: 1rem;
`;
const Row = styled.div`
  display: flex;
  gap: 1rem;
`;
