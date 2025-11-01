"use client";

import { createUsePuck } from "@measured/puck";

// Ceci crée le hook ET le contexte
const usePuckStore = createUsePuck();

// Exporter le hook
export const usePuck = usePuckStore;

// Exporter le contexte que le hook a créé
// (Puck attache le Contexte en tant que propriété du hook)
export const PuckContext = (usePuckStore as any).Context;