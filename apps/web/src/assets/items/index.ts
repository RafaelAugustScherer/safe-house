import type { FC, SVGProps } from "react";
import {
  FallbackIcon,
  MedicineIcon,
  BagIcon,
  CrowbarIcon,
  MapIcon,
  WalkieTalkieIcon,
  PistolIcon,
  RifleIcon,
  MachineGunIcon,
  ShotgunIcon,
  ChainsawIcon,
  KnifeIcon,
  ShovelIcon,
  BatIcon,
  AxeIcon,
  MacheteIcon,
  MotorcycleIcon,
  BikeIcon,
  BuggyIcon,
  TractorIcon,
  PickupIcon,
} from "./icons";

export type ItemIcon = FC<SVGProps<SVGSVGElement>>;

// Keys must match the `key` field on every entry in CARDS
// (packages/shared/src/index.ts).
export const ICON_BY_KEY: Record<string, ItemIcon> = {
  medicine: MedicineIcon,
  bag: BagIcon,
  crowbar: CrowbarIcon,
  map: MapIcon,
  "walkie-talkie": WalkieTalkieIcon,
  pistol: PistolIcon,
  rifle: RifleIcon,
  "machine-gun": MachineGunIcon,
  shotgun: ShotgunIcon,
  chainsaw: ChainsawIcon,
  knife: KnifeIcon,
  shovel: ShovelIcon,
  bat: BatIcon,
  axe: AxeIcon,
  machete: MacheteIcon,
  motorcycle: MotorcycleIcon,
  bike: BikeIcon,
  buggy: BuggyIcon,
  tractor: TractorIcon,
  pickup: PickupIcon,
};

export { FallbackIcon };

export const getItemIcon = (key: string): ItemIcon =>
  ICON_BY_KEY[key] ?? FallbackIcon;
