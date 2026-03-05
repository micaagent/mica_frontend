// src/exportToPDF.js

// FIX 1: Use Named Imports. Vite requires this to properly bundle jsPDF.
import { jsPDF } from 'jspdf'; 

// FIX 2: Import autoTable as a standalone function rather than relying on prototype injection.
import autoTable from 'jspdf-autotable'; 

export const exportChatToPDF = (chatHistory, modeName) => {
    // FIX 3: Wrap everything in a try...catch block to prevent silent failures
    try {
        // Check if conversation exists
        if (!chatHistory || chatHistory.length === 0) {
            alert("No conversation to export yet. Please chat with MICA first!");
            return;
        }

        // Initialize document
        const doc = new jsPDF();
        const date = new Date().toLocaleString();

        // --- Header Styling ---
        doc.setFontSize(22);
        doc.setTextColor(0, 210, 255); // MICA Cyan
        doc.text(`MICA Intelligence Hub`, 14, 22);
        
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text(`Session Transcript: ${modeName}`, 14, 32);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${date}`, 14, 40);

        // --- Table Data Construction ---
        const tableColumn = ["Speaker", "Message"];
        const tableRows = [];

        chatHistory.forEach(msg => {
            // Standardize speaker names
            const speaker = msg.sender === 'user' ? 'User' : 'MICA';
            tableRows.push([speaker, msg.text]);
        });

        // --- Generate Auto-formatting Table ---
        // FIX 4: Call autoTable explicitly, passing the 'doc' as the first argument.
        // This bypasses Vite's strict module blocking.
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 48,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: { fillColor: [26, 31, 60], textColor: [0, 210, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 30, fontStyle: 'bold', textColor: [26, 31, 60] },
                1: { cellWidth: 'auto' } // Auto-wraps long LLM responses
            }
        });

        // --- Trigger Download ---
        const filename = `MICA_${modeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        doc.save(filename);

    } catch (error) {
        // If anything fails, log it to the console and alert the user so it doesn't fail silently.
        console.error("PDF Export Critical Error:", error);
        alert(`Failed to generate PDF: ${error.message}`);
    }
};