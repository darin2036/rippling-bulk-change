import { loadJSON, saveJSON } from "../../lib/storage";

const SELECTED_KEY = "rbp_bulk_selected_ids_v1";

export function saveSelectedIds(ids: string[]) {
  saveJSON(SELECTED_KEY, ids);
}

export function loadSelectedIds(): string[] {
  return loadJSON<string[]>(SELECTED_KEY, []);
}

export function clearSelectedIds() {
  saveJSON(SELECTED_KEY, []);
}
