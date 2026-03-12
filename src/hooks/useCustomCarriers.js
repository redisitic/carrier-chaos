import { useState, useCallback, useEffect } from "react";
import { CARRIERS } from "../game/constants";

// Global in-memory storage for custom carriers during the session
let globalCustomCarriers = [];

// Subscribe callbacks to notify hooks across the app when the global array changes
const listeners = new Set();
function notifyListeners() {
  for (const listener of listeners) {
    listener(globalCustomCarriers);
  }
}

export function useCustomCarriers() {
  const [customCarriers, setCustomCarriers] = useState(globalCustomCarriers);

  useEffect(() => {
    listeners.add(setCustomCarriers);
    return () => listeners.delete(setCustomCarriers);
  }, []);

  const addCarrier = useCallback((carrier) => {
    globalCustomCarriers = [...globalCustomCarriers, { ...carrier, _custom: true }];
    notifyListeners();
  }, []);

  const updateCarrier = useCallback((index, carrier) => {
    globalCustomCarriers = globalCustomCarriers.map((c, i) => i === index ? { ...carrier, _custom: true } : c);
    notifyListeners();
  }, []);

  const removeCarrier = useCallback((index) => {
    globalCustomCarriers = globalCustomCarriers.filter((_, i) => i !== index);
    notifyListeners();
  }, []);

  return { customCarriers, addCarrier, updateCarrier, removeCarrier };
}

/** Returns built-in + custom carriers merged (read-only snapshot from memory). */
export function getAllCarriers() {
  return [...CARRIERS, ...globalCustomCarriers];
}

/** Sync version that uses an already-loaded array. */
export function mergeCarriers(customCarriers) {
  return [...CARRIERS, ...(customCarriers || [])];
}
