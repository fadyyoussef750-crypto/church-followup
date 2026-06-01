export async function exportToPDF(groupName, roundName, members) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Church Followup Report', 14, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Group: ${groupName}`, 14, 30)
  if (roundName) doc.text(`Round: ${roundName}`, 14, 37)
  doc.text(`Date: ${new Date().toLocaleDateString('en-EG')}`, 14, roundName ? 44 : 37)

  const statusMap = {
    visited: 'Visited',
    no_answer: 'No Answer',
    not_visited: 'Not Visited',
  }

  const rows = members.map((m, i) => [
    i + 1,
    m.name,
    m.phone,
    statusMap[m.visits?.[0]?.status || 'not_visited'],
    m.visits?.[0]?.profiles?.name || '-',
    m.visits?.[0]?.note || '-',
  ])

  autoTable(doc, {
    startY: roundName ? 52 : 45,
    head: [['#', 'Name', 'Phone', 'Status', 'Servant', 'Note']],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 30 },
    },
  })

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(`${groupName}-${roundName || 'report'}.pdf`)
}

export async function exportToExcel(groupName, roundName, members) {
  const XLSX = await import('xlsx')

  const statusMap = {
    visited: 'افتقد',
    no_answer: 'ما ردش',
    not_visited: 'لم يُفتقد',
  }

  const data = members.map((m, i) => ({
    '#': i + 1,
    'الاسم': m.name,
    'التليفون': m.phone,
    'الحالة': statusMap[m.visits?.[0]?.status || 'not_visited'],
    'الخادم': m.visits?.[0]?.profiles?.name || '-',
    'ملاحظة': m.visits?.[0]?.note || '-',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 15 },
    { wch: 12 }, { wch: 20 }, { wch: 30 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, groupName.slice(0, 31))
  XLSX.writeFile(wb, `${groupName}-${roundName || 'report'}.xlsx`)
}
