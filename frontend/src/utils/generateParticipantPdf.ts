import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ClassParticipantsData } from "../api/groupClassesService";

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const loadRoboto = async (doc: jsPDF) => {
  const res = await fetch("/fonts/Roboto-Regular.ttf");
  const buf = await res.arrayBuffer();
  const binary = String.fromCharCode(...new Uint8Array(buf));
  const base64 = btoa(binary);
  doc.addFileToVFS("Roboto-Regular.ttf", base64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");
};

export const generateParticipantPdf = async (data: ClassParticipantsData, gymName: string) => {
  const doc = new jsPDF();
  await loadRoboto(doc);

  const date = new Date(data.date);
  const dateLabel = date.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFontSize(18);
  doc.text("Lista uczestników", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(gymName, 14, 28);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  let y = 38;
  doc.text(data.className, 14, y);

  y += 8;
  doc.text(`Data: ${dateLabel}`, 14, y);

  y += 7;
  doc.text(`Godzina: ${minutesToTime(data.startTime)} – ${minutesToTime(data.endTime)}`, 14, y);

  if (data.room) {
    y += 7;
    doc.text(
      `Sala: ${data.room.name}${data.room.capacity ? ` (pojemność: ${data.room.capacity})` : ""}`,
      14,
      y
    );
  }

  if (data.instructors.length > 0) {
    y += 7;
    const names = data.instructors
      .map((i) => `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim())
      .filter(Boolean)
      .join(", ");
    doc.text(`Prowadzący: ${names}`, 14, y);
  }

  y += 7;
  const capacityLabel = data.capacity
    ? `${data.participants.length} / ${data.capacity} miejsc`
    : `${data.participants.length} uczestników`;
  doc.text(`Liczba uczestników: ${capacityLabel}`, 14, y);

  autoTable(doc, {
    startY: y + 8,
    head: [["Lp.", "Imię i nazwisko", "E-mail"]],
    body:
      data.participants.length > 0
        ? data.participants.map((p, i) => [
            i + 1,
            `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—",
            p.email,
          ])
        : [["", "Brak zapisanych uczestników", ""]],
    headStyles: { fillColor: [14, 165, 233], font: "Roboto", fontStyle: "normal" },
    bodyStyles: { font: "Roboto" },
    footStyles: { font: "Roboto" },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 70 },
      2: { cellWidth: "auto" },
    },
    styles: { fontSize: 10 },
  });

  const safeName = data.className.replace(/[^a-zA-Z0-9À-žĄąĆćĘęŁłŃńÓóŚśŹźŻż]/g, "-").toLowerCase();
  const safeDate = date.toLocaleDateString("pl-PL").replace(/\./g, "-");
  doc.save(`lista-uczestnikow-${safeName}-${safeDate}.pdf`);
};
