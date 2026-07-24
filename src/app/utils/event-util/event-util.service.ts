import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class EventUtilityService {
  // 1. Reusable Date Math
  calculateRange(months: number) {

    // If months is -1, we return null to clear the filter
  if (months === -1) {
    return { start: '', end: '' }; 
  }

    const end = new Date();
    const start = new Date();
    if (months === 0.033) start.setDate(end.getDate() - 1);
    else if (months === 0.25) start.setDate(end.getDate() - 7);
    else start.setMonth(end.getMonth() - months);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // 2. Reusable LocalStorage Sync
  getSavedSelections() {
    const saved = JSON.parse(localStorage.getItem('chms-dms.web.selected_options') || '{}');
    return {
      targetPath: saved.managed || saved.primary || "",
      farmId: saved.farm || ""
    };
  }
}