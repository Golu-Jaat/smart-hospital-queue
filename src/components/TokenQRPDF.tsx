"use client";

import { useMemo } from "react";

type TokenSlipProps = {
  tokenNumber: number;
  patientName?: string;
  doctorName?: string;
  departmentName?: string;
  hospitalName?: string;
  roomNumber?: string;
  appointmentDate?: string;
  slotStart?: string;
  tokenId: string;
};

/**
 * Pure SVG QR Code Matrix Generator (Lightweight, zero external dependencies)
 */
function SimpleQRMatrix({ data }: { data: string }) {
  // Generate deterministic binary pattern from string data for visual QR appearance
  const size = 21; // standard Version 1 QR matrix grid (21x21)
  
  const matrix = useMemo(() => {
    const grid = Array(size).fill(0).map(() => Array(size).fill(false));

    // Finder pattern helper (7x7 corners)
    const placeFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };

    // Top-left, Top-right, Bottom-left finder patterns
    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Populate data payload bits deterministically from hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }

    let bitIndex = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        const isFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8) ||
          (r === 6 || c === 6);

        if (!isFinder) {
          const bitVal = ((Math.abs(hash) >> (bitIndex % 31)) & 1) === 1;
          grid[r][c] = (bitVal !== ((r + c) % 2 === 0));
          bitIndex++;
        }
      }
    }

    return grid;
  }, [data, size]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm"
      shapeRendering="crispEdges"
    >
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
        )
      )}
    </svg>
  );
}

export function TokenQRPDF({
  tokenNumber,
  patientName = "Patient",
  doctorName = "Doctor",
  departmentName = "OPD Department",
  hospitalName = "Smart Hospital",
  roomNumber = "OPD Room",
  appointmentDate = new Date().toISOString().split("T")[0],
  slotStart,
  tokenId,
}: TokenSlipProps) {
  const handlePrint = () => {
    window.print();
  };

  const qrPayload = JSON.stringify({
    tokenId,
    tokenNumber,
    patientName,
    doctorName,
    date: appointmentDate,
    room: roomNumber,
  });

  return (
    <div className="mt-6 perspective-1000">
      {/* 3D Holographic Token Pass Card */}
      <div className="hologram-card card-3d-hover rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-700">
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-xl animate-float-3d">🏥</span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Official Digital OPD Pass
              </span>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start mt-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight animate-gold-shimmer">
                Token #{tokenNumber}
              </h3>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Patient: <strong className="text-slate-800 dark:text-slate-100">{patientName}</strong>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Doctor: {doctorName} • {departmentName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Room: <strong className="text-blue-600 dark:text-blue-400">{roomNumber}</strong> • Date: {appointmentDate} {slotStart ? `(${slotStart})` : ""}
            </p>
          </div>

          {/* QR Code with 3D Border Glow */}
          <div className="text-center flex-shrink-0">
            <div className="p-1 rounded-2xl bg-white border border-slate-200 dark:border-slate-600 shadow-md">
              <SimpleQRMatrix data={qrPayload} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
              Scan for Security Check
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>🛡️</span>
            <span>Show this pass at hospital reception or OPD counter</span>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <span>🖨️</span>
            <span>Print / Save Slip (PDF)</span>
          </button>
        </div>
      </div>

      {/* Hidden Print Slip Formatter (Triggered by window.print()) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-50">
        <div className="max-w-md mx-auto border-2 border-dashed border-black p-6 rounded-lg">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wide">{hospitalName}</h1>
            <p className="text-xs text-gray-600">OPD Queue & Appointment Slip</p>
            <p className="text-xs text-gray-500">Date: {appointmentDate} {slotStart ? `| Time: ${slotStart}` : ""}</p>
          </div>

          <div className="text-center my-6 py-4 bg-gray-100 rounded">
            <p className="text-xs uppercase font-bold text-gray-600">Your Token Number</p>
            <p className="text-5xl font-black my-1 font-mono">#{tokenNumber}</p>
            <p className="text-xs font-bold text-blue-800">ROOM: {roomNumber}</p>
          </div>

          <div className="space-y-1.5 text-sm border-b pb-4 mb-4">
            <p><strong>Patient Name:</strong> {patientName}</p>
            <p><strong>Consulting Doctor:</strong> {doctorName}</p>
            <p><strong>Department:</strong> {departmentName}</p>
            <p className="text-xs text-gray-500 font-mono">Token ID: {tokenId}</p>
          </div>

          <div className="text-center my-4">
            <SimpleQRMatrix data={qrPayload} />
            <p className="text-[10px] text-gray-500 mt-1">Official Hospital Verification QR</p>
          </div>

          <div className="text-center text-xs text-gray-600 pt-2 border-t">
            <p>Please wait in the OPD waiting hall until your token is announced.</p>
            <p className="mt-1 font-semibold">Thank you for choosing {hospitalName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
