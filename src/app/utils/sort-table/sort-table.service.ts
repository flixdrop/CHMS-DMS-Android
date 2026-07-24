import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class SortTableService {
  constructor() {}

  sortTable(
    columnIndex: number,
    tableId: string,
    sortOrders: { [key: number]: string }
  ): { [key: number]: string } {
    document.querySelectorAll("th.sort-asc, th.sort-desc").forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
    });
    const table = document.getElementById(tableId);
    if (!table) {
      return sortOrders;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody) {
      return sortOrders;
    }
    const rows = Array.from(tbody.querySelectorAll("tr"));

    // Get the current sorting order for the column or initialize it to 'asc'
    let sortOrder = sortOrders[columnIndex] || "asc";

    rows.sort((a, b) => {
      const cellA = a.cells[columnIndex].textContent.trim();
      const cellB = b.cells[columnIndex].textContent.trim();

      // Check if the column is numeric
      const isNumeric = !isNaN(+cellA) && !isNaN(+cellB);
      let comparison;

      if (isNumeric) {
        const numberA = parseFloat(cellA);
        const numberB = parseFloat(cellB);
        comparison = numberA - numberB;
      } else {
        comparison = cellA.localeCompare(cellB, undefined, { numeric: true });
      }

      // Apply sorting order based on current sortOrder
      if (sortOrder === "desc") {
        return comparison * -1; // Reverse the sorting order
      }

      return comparison;
    });

    // Toggle the sorting order for the column
    sortOrder = sortOrder === "asc" ? "desc" : "asc";
    sortOrders[columnIndex] = sortOrder;

    // Clear the existing table rows
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }

    // Append sorted rows back to the table
    rows.forEach((row) => tbody.appendChild(row));

    return sortOrders;
  }
}
