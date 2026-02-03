import React, { useRef } from 'react';
import { Download, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
    qrCodeUrl: string;
}

export default function QRCodeDisplay({ qrCodeUrl }: QRCodeDisplayProps) {
    const handleDownloadQR = () => {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `event-qr-${Date.now()}.png`;
        link.click();
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>QR Kod Yazdır</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
              .container { text-align: center; }
              img { max-width: 500px; max-height: 500px; }
              h1 { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Etkinlik Katılım Kodu</h1>
              <img src="${qrCodeUrl}" />
              <p>Hemen tarayın ve katılın!</p>
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    return (
        <div className="bg-gray-50 rounded-xl p-6 text-center mb-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QR Kod</h3>

            <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-4 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={qrCodeUrl}
                    alt="Event QR Code"
                    className="w-64 h-64 object-contain"
                />
            </div>

            <p className="text-sm text-gray-500 mb-4">
                Katılımcılar bu QR kodu tarayarak hızlıca katılabilir
            </p>

            <div className="flex justify-center gap-3">
                <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4 mr-2" />
                    İndir
                </button>
                <button
                    onClick={handlePrintQR}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Yazdır
                </button>
            </div>
        </div>
    );
}
