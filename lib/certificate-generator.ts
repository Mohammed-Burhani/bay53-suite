import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CertificateData {
  certificateNumber: string;
  certificateDate: string;
  customerName: string;
  customerAddress: string;
  instrumentName: string;
  makeSerial: string;
  mounting: string;
  range: string;
  accuracy: string;
  calibrationDueDate: string;
  testConditions: string;
  masterRange: string;
  masterCalibrationDue: string;
  masterCertificateNo: string;
  testResults: Array<{
    calibratedRange: string;
    masterValue: string;
    instrumentValue: string;
    deviation: string;
  }>;
  calibratedBy: string;
  approvedBy: string;
}

export function generateCertificateNumber(invoiceNumber: string, itemIndex: number): string {
  const year = new Date().getFullYear();
  const shortYear = year.toString().slice(-2);
  const nextYear = (year + 1).toString().slice(-2);
  return `CAL/${invoiceNumber}/${itemIndex + 1}/${shortYear}-${nextYear}`;
}

function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
}

function createCertificatePage(
  doc: jsPDF,
  data: CertificateData,
  isFirstPage: boolean
): void {
  if (!isFirstPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  type DocWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF TRACEABLE CALIBRATION", pageWidth / 2, 20, {
    align: "center",
  });

  // Certificate Number and Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Calibration Certificate no.: ${data.certificateNumber} dated ${data.certificateDate}`,
    margin,
    35
  );

  let yPos = 45;

  // Customer Details Table
  autoTable(doc, {
    startY: yPos,
    head: [["Customer Details", ""]],
    body: [
      ["Name", data.customerName],
      ["Address", data.customerAddress],
    ],
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: "bold" } as Record<string, unknown>,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;

  // Instrument Details Table
  autoTable(doc, {
    startY: yPos,
    head: [["Details of Instrument Under Test", ""]],
    body: [
      ["Instrument", data.instrumentName],
      ["Make & Serial no.", data.makeSerial],
      ["Mounting & Connection", data.mounting],
      ["Range", data.range],
      ["Accuracy", data.accuracy],
      ["Calibration due on", formatDateForDisplay(data.calibrationDueDate)],
      ["Test conditions", data.testConditions],
    ],
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: "bold" } as Record<string, unknown>,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;

  // Master Instrument Details Table
  autoTable(doc, {
    startY: yPos,
    head: [["Details of Master Instrument", ""]],
    body: [
      ["Range", data.masterRange],
      ["Calibration due on", formatDateForDisplay(data.masterCalibrationDue)],
      ["Certificate no.", data.masterCertificateNo],
    ],
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: "bold" } as Record<string, unknown>,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;

  // Test Results Table
  autoTable(doc, {
    startY: yPos,
    head: [
      [
        {
          content: "TEST RESULTS",
          colSpan: 4,
          styles: { halign: "center", fillColor: [200, 200, 200] } as Record<string, unknown>,
        },
      ],
      [
        "Calibrated Range\n(in units)",
        "Master Value\n(in units)",
        "Instrument under test value\n(in units)",
        "Deviation\n(Allowed ±0.4 units)",
      ],
    ],
    body: data.testResults.map((result) => [
      result.calibratedRange,
      result.masterValue,
      result.instrumentValue,
      result.deviation,
    ]),
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: "bold" } as Record<string, unknown>,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as DocWithAutoTable).lastAutoTable.finalY + 15;

  // Signatures
  doc.setFontSize(10);
  doc.text(`Calibrated by: ${data.calibratedBy}`, margin, yPos);
  doc.text(`Approved By: ${data.approvedBy}`, pageWidth - margin - 60, yPos);
  
  yPos += 10;
  doc.text(data.certificateDate, margin, yPos);
  doc.text(data.certificateDate, pageWidth - margin - 60, yPos);

  // Footer Notes
  yPos += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const footerText = [
    "The instrument has been calibrated using standard traceable to national standards linked with NABL",
    "This certificate shall not be reproduced, except in full without the written approval of calibration facility",
    "Results reported are valid at the time of and under stated conditions of measurements",
  ];
  
  footerText.forEach((text) => {
    doc.text(text, pageWidth / 2, yPos, { align: "center", maxWidth: pageWidth - 2 * margin });
    yPos += 5;
  });
}

export async function generateCalibrationCertificatePDF(
  invoiceNumber: string,
  certificatesData: CertificateData[]
): Promise<void> {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleDateString("en-GB");

  certificatesData.forEach((certificateData, index) => {
    createCertificatePage(doc, certificateData, index === 0);
  });

  // Download the PDF
  doc.save(`Calibration_Certificate_${invoiceNumber}_${currentDate.replace(/\//g, "-")}.pdf`);
}
