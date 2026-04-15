import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type DocWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };

/**
 * Export table data to Excel (CSV format)
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  headers: { key: string; label: string }[],
  filename: string
) {
  if (data.length === 0) return;

  // Create CSV content
  const csvHeaders = headers.map((h) => h.label).join(",");
  const csvRows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",")
  );

  const csvContent = [csvHeaders, ...csvRows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export table data to PDF
 */
export function exportToPDF(
  data: Record<string, unknown>[],
  headers: { key: string; label: string }[],
  title: string,
  filename: string
) {
  if (data.length === 0) return;

  const doc = new jsPDF() as DocWithAutoTable;

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 28);

  // Prepare table data
  const tableHeaders = headers.map((h) => h.label);
  const tableData = data.map((row) =>
    headers.map((h) => {
      const value = row[h.key];
      if (value === null || value === undefined) return "";
      return String(value);
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 35 },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
}

/**
 * Print table data
 */
export function printTable(
  data: Record<string, unknown>[],
  headers: { key: string; label: string }[],
  title: string
) {
  if (data.length === 0) return;

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  // Build HTML table
  const tableHeaders = headers.map((h) => `<th>${h.label}</th>`).join("");
  const tableRows = data
    .map(
      (row) =>
        `<tr>${headers
          .map((h) => {
            const value = row[h.key];
            return `<td>${value !== null && value !== undefined ? String(value) : ""}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 10px;
          }
          .date {
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #3b82f6;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f5f7fa;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Generated: ${new Date().toLocaleString("en-IN")}</div>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
