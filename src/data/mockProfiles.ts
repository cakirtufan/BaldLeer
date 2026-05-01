import { DemoProfile } from "@/domain/types";

export const mockProfiles: DemoProfile[] = [
  {
    id: "family",
    name: "Familie mit Kleinkind",
    description: "Regelmäßige Haushalts- und Babyprodukte mit kurzen Nachkaufzyklen."
  },
  {
    id: "single",
    name: "Single-Haushalt",
    description: "Weniger häufige Einkäufe, Kaffee und Pflegeprodukte mit längeren Intervallen."
  },
  {
    id: "pet",
    name: "Haustierbesitzer",
    description: "Tierfutter, Küchenpapier und Reiniger als wiederkehrende Bedarfe."
  }
];
