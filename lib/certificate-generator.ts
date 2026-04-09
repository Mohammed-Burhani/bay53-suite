import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Certificate } from "./services/certificates.service";

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
    actual_value?: string;
    expected_value?: string;
    error?: string;
    // Legacy fields for backward compatibility
    calibratedRange?: string;
    masterValue?: string;
    instrumentValue?: string;
    deviation?: string;
    reading?: string;
    standard?: string;
  }>;
  testResultsCommonField?: string;
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



async function createCertificatePage(
  doc: jsPDF,
  data: CertificateData,
  isFirstPage: boolean
): Promise<void> {
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
      ["Address", data.customerAddress || "N/A"],
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
      ["Make & Serial no.", data.makeSerial || "N/A"],
      ["Mounting & Connection", data.mounting || "N/A"],
      ["Range", data.range || "N/A"],
      ["Accuracy", data.accuracy || "N/A"],
      ["Calibration due on", data.calibrationDueDate ? formatDateForDisplay(data.calibrationDueDate) : "N/A"],
      ["Test conditions", data.testConditions || "N/A"],
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
      ["Range", data.masterRange || "N/A"],
      ["Calibration due on", data.masterCalibrationDue ? formatDateForDisplay(data.masterCalibrationDue) : "N/A"],
      ["Certificate no.", data.masterCertificateNo || "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: "bold" } as Record<string, unknown>,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as DocWithAutoTable).lastAutoTable.finalY + 10;

  // Test Results Table
  if (data.testResults && data.testResults.length > 0) {
    const hasCommonField = data.testResultsCommonField && data.testResultsCommonField.trim();
    
    // Prepare table body with proper structure
    const tableBody = data.testResults.map((result: Record<string, string>, index: number) => {
      const row = [
        // First column: show common field only in first row, empty for others
        index === 0 && hasCommonField ? {
          content: data.testResultsCommonField,
          rowSpan: data.testResults.length,
          styles: { valign: "middle", halign: "center" } as Record<string, unknown>
        } : "",
        // Second column: Master Value (Expected Value)
        result.expected_value || result.standard || result.masterValue || "0",
        // Third column: Instrument Value (Actual Value)
        result.actual_value || result.reading || result.instrumentValue || "0",
        // Fourth column: Deviation (Error)
        result.error || result.deviation || "0",
      ];
      
      // For rows after the first, remove the first column since it's merged
      if (index > 0 && hasCommonField) {
        return row.slice(1);
      }
      
      return row;
    });
    
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
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: "bold" } as Record<string, unknown>,
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - 2 * margin,
    });

    yPos = (doc as DocWithAutoTable).lastAutoTable.finalY + 15;
  }

  // Signatures
  doc.setFontSize(10);
  doc.text(`Calibrated by: ${data.calibratedBy || "N/A"}`, margin, yPos);
  doc.text(`Approved By: ${data.approvedBy || "N/A"}`, pageWidth - margin - 60, yPos);
  
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

  for (let index = 0; index < certificatesData.length; index++) {
    await createCertificatePage(doc, certificatesData[index], index === 0);
  }

  // Download the PDF
  doc.save(`Calibration_Certificate_${invoiceNumber}_${currentDate.replace(/\//g, "-")}.pdf`);
}

// New function to generate PDF from database Certificate
export async function generateCertificatePDF(certificate: Certificate): Promise<void> {
  const doc = new jsPDF();

  const certificateData: CertificateData = {
    certificateNumber: certificate.certificate_number,
    certificateDate: formatDateForDisplay(certificate.certificate_date),
    customerName: certificate.customer_name,
    customerAddress: certificate.customer_address || "",
    instrumentName: certificate.instrument_name,
    makeSerial: certificate.make_serial || "",
    mounting: certificate.mounting || "",
    range: certificate.range || "",
    accuracy: certificate.accuracy || "",
    calibrationDueDate: certificate.calibration_due_date || "",
    testConditions: certificate.test_conditions || "",
    masterRange: certificate.master_range || "",
    masterCalibrationDue: certificate.master_calibration_due || "",
    masterCertificateNo: certificate.master_certificate_no || "",
    testResults: (certificate.test_results || []) as Array<{
      actual_value?: string;
      expected_value?: string;
      error?: string;
      calibratedRange?: string;
      masterValue?: string;
      instrumentValue?: string;
      deviation?: string;
      reading?: string;
      standard?: string;
    }>,
    testResultsCommonField: certificate.test_results_common_field,
    calibratedBy: certificate.calibrated_by || "",
    approvedBy: certificate.approved_by || "",
  };

  await createCertificatePage(doc, certificateData, true);

  // Download the PDF
  const fileName = `Certificate_${certificate.certificate_number.replace(/\//g, "_")}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
}

// New function to print certificate
export async function printCertificate(certificate: Certificate): Promise<void> {
  const doc = new jsPDF();

  const certificateData: CertificateData = {
    certificateNumber: certificate.certificate_number,
    certificateDate: formatDateForDisplay(certificate.certificate_date),
    customerName: certificate.customer_name,
    customerAddress: certificate.customer_address || "",
    instrumentName: certificate.instrument_name,
    makeSerial: certificate.make_serial || "",
    mounting: certificate.mounting || "",
    range: certificate.range || "",
    accuracy: certificate.accuracy || "",
    calibrationDueDate: certificate.calibration_due_date || "",
    testConditions: certificate.test_conditions || "",
    masterRange: certificate.master_range || "",
    masterCalibrationDue: certificate.master_calibration_due || "",
    masterCertificateNo: certificate.master_certificate_no || "",
    testResults: (certificate.test_results || []) as Array<{
      actual_value?: string;
      expected_value?: string;
      error?: string;
      calibratedRange?: string;
      masterValue?: string;
      instrumentValue?: string;
      deviation?: string;
      reading?: string;
      standard?: string;
    }>,
    testResultsCommonField: certificate.test_results_common_field,
    calibratedBy: certificate.calibrated_by || "",
    approvedBy: certificate.approved_by || "",
  };

  await createCertificatePage(doc, certificateData, true);

  // Open print dialog
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

