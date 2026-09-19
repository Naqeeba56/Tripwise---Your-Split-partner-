import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an official Tripwise PDF Settlement & Expense Statement.
 * 
 * @param {Object} trip - Trip object { name, creatorName, creatorUpi, members }
 * @param {Array} expenses - Array of expenses
 * @param {Array} settlements - Array of settlements
 * @param {Object} settlementDetailsMap - Map of completed settlement details
 * @param {Array} settledIds - List of settled IDs
 * @param {Object} netBalances - Net balance object
 * @param {number} totalSpent - Total amount spent
 * @param {number} perPersonShare - Per person fair share
 */
export const generateTripPdfReceipt = (
  trip,
  expenses = [],
  settlements = [],
  settlementDetailsMap = {},
  settledIds = [],
  netBalances = {},
  totalSpent = 0,
  perPersonShare = 0
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [20, 184, 166]; // #14b8a6 (Teal)
  const darkColor = [15, 23, 42];      // #0f172a (Slate 900)
  const grayColor = [100, 116, 139];   // #64748b (Slate 500)
  const emeraldColor = [16, 185, 129]; // #10b981

  // Header Banner
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 42, 'F');

  // Accent Line
  doc.setFillColor(...primaryColor);
  doc.rect(0, 42, 210, 2, 'F');

  // App Title & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text('TRIPWISE', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 230);
  doc.text('Official Group Expense & Settlement Statement', 14, 28);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 34);

  // Status Badge
  const allSettled = settlements.length > 0 && settlements.every((s) => settledIds.includes(s.id));
  const settledAmountTotal = settlements
    .filter((s) => settledIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const pendingAmountTotal = settlements
    .filter((s) => !settledIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  if (allSettled) {
    doc.setFillColor(...emeraldColor);
    doc.roundedRect(148, 14, 48, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('FULLY SETTLED', 154, 23);
  } else {
    doc.setFillColor(...primaryColor);
    doc.roundedRect(148, 14, 48, 14, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.text('ACTIVE STATEMENT', 150, 23);
  }

  // Trip Info Box
  let yPos = 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(trip.name || 'Trip Summary', 14, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Organized by: ${trip.creatorName || 'Organizer'}  |  UPI ID: ${trip.creatorUpi || 'N/A'}  |  Total Members: ${trip.members?.length || 0}`, 14, yPos);

  // Key Metrics Card
  yPos += 8;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, yPos, 182, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(`Rs. ${totalSpent.toLocaleString('en-IN')}`, 24, yPos + 12);
  doc.text(`Rs. ${Math.round(perPersonShare).toLocaleString('en-IN')}`, 88, yPos + 12);
  doc.text(`${expenses.length} Items`, 150, yPos + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('TOTAL GROUP SPEND', 24, yPos + 18);
  doc.text('EQUAL SHARE / PERSON', 88, yPos + 18);
  doc.text('EXPENSES LOGGED', 150, yPos + 18);

  yPos += 30;

  // Completion Ribbon — only when every settlement has been paid.
  if (allSettled) {
    doc.setFillColor(...emeraldColor);
    doc.setDrawColor(...emeraldColor);
    doc.roundedRect(14, yPos, 182, 16, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('✔ TRIP COMPLETE — ALL SETTLEMENTS PAID', 20, yPos + 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Settled: Rs. ${settledAmountTotal.toLocaleString('en-IN')}  ·  Pending: Rs. 0  ·  ${settlements.length} transactions logged`, 20, yPos + 13);
    yPos += 24;
  } else if (settledAmountTotal > 0) {
    doc.setFillColor(...emeraldColor);
    doc.roundedRect(14, yPos, 182, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Progress: Rs. ${settledAmountTotal.toLocaleString('en-IN')} settled  ·  Rs. ${pendingAmountTotal.toLocaleString('en-IN')} remaining`, 20, yPos + 9);
    yPos += 22;
  }

  // 1. Member Balance Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text('1. Member Balance Breakdown', 14, yPos);

  const memberRows = (trip.members || []).map((m) => {
    const memberName = typeof m === 'string' ? m : m.name;
    const paidTotal = expenses.reduce((sum, e) => {
      const eps = Array.isArray(e.payers) && e.payers.length
        ? e.payers
        : [{ name: e.paidBy || e.payer || 'Unknown', amount: Number(e.amount || 0) }];
      const hit = eps.find((p) => p.name === memberName);
      return sum + (hit ? Number(hit.amount || 0) : 0);
    }, 0);
    const balance = netBalances[memberName] || 0;
    const rounded = Math.round(balance);
    const statusText = rounded > 0 ? `+ Rs. ${rounded} (Receives)` : rounded < 0 ? `- Rs. ${Math.abs(rounded)} (Owes)` : 'Settled (Rs. 0)';

    return [memberName, `Rs. ${paidTotal.toLocaleString('en-IN')}`, `Rs. ${Math.round(perPersonShare).toLocaleString('en-IN')}`, statusText];
  });

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Member Name', 'Total Paid', 'Fair Share', 'Net Balance']],
    body: memberRows,
    theme: 'grid',
    headStyles: { fillColor: darkColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // 2. Settlement Transactions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text('2. Settlement Matrix & Payment Log', 14, yPos);

  const settlementRows = settlements.map((s) => {
    const isSettled = settledIds.includes(s.id);
    const details = settlementDetailsMap[s.id];
    const status = isSettled ? 'SETTLED' : 'PENDING';
    const method = details?.method || (isSettled ? 'UPI Transfer' : 'Unpaid');
    const txId = details?.transactionId || '-';
    const date = details?.settledDate ? `${details.settledDate} ${details.settledAt || ''}` : '-';

    return [`${s.from} -> ${s.to}`, `Rs. ${s.amount.toLocaleString('en-IN')}`, status, method, txId, date];
  });

  const settledTotal = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const footRow = settlements.length > 0
    ? [[
        'TOTAL',
        `Rs. ${settledTotal.toLocaleString('en-IN')}`,
        `${settledIds.length} / ${settlements.length} settled`,
        '',
        '',
        '',
      ]]
    : null;

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Transaction', 'Amount', 'Status', 'Method', 'Transaction Ref', 'Settled Date']],
    body: settlementRows.length > 0 ? settlementRows : [['No settlements', '-', '-', '-', '-', '-']],
    foot: footRow,
    footStyles: { fillColor: darkColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // 3. Expense Ledger (if space permits on page 1, else page 2)
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text('3. Detailed Expense Ledger', 14, yPos);

  const expenseRows = expenses.map((e, idx) => {
    const paidByLabel = Array.isArray(e.payers) && e.payers.length
      ? e.payers.map((p) => `${p.name} (₹${Number(p.amount || 0).toLocaleString('en-IN')})`).join(', ')
      : (e.paidBy || e.payer || 'Unknown');
    return [
      `#${idx + 1}`,
      e.title,
      e.category || 'General',
      paidByLabel,
      `Rs. ${Number(e.amount).toLocaleString('en-IN')}`,
    ];
  });

  autoTable(doc, {
    startY: yPos + 3,
    head: [['#', 'Expense Title', 'Category', 'Paid By', 'Amount']],
    body: expenseRows,
    theme: 'grid',
    headStyles: { fillColor: darkColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Footer & Digital Stamp
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Tripwise - Smart Group Expense Splitting & Direct UPI Settlement', 14, 290);
    doc.text(`Page ${p} of ${totalPages}`, 185, 290);
  }

  return doc;
};
