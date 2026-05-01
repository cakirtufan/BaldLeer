import { DemoProfile } from "@/domain/types";

export const mockProfiles: DemoProfile[] = [
  {
    id: "family",
    name: "Kombinierte eBon-Historie",
    description: "Reale dm- und Rossmann-eBons als realistische Demo-Datenbasis."
  },
  {
    id: "single",
    name: "dm eBon-Historie",
    description: "dm-Einkaeufe mit Baby, Haushalt, Pflege und Vorratskaeufen."
  },
  {
    id: "pet",
    name: "Rossmann eBon-Historie",
    description: "Rossmann-Einkaeufe mit Baby, Pflege, Gesundheit und Reinigung."
  }
];
