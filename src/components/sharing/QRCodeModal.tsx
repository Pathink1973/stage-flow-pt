import { useState, useEffect } from 'react';
import { X, Download, Copy, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  label: string;
  roomName: string;
}

export function QRCodeModal({ isOpen, onClose, url, title, label, roomName }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(url)}&format=png`;
      setQrImageUrl(qrUrl);
    }
  }, [isOpen, url]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${roomName}-${title.replace(/\s+/g, '-')}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="neumo-raised rounded-[var(--radius-lg)] bg-[var(--bg)] max-w-lg w-full p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--fg)] mb-1">{title}</h2>
            <p className="text-sm text-[var(--fg)] opacity-70">{roomName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--fg)] hover:bg-opacity-10 transition-colors"
          >
            <X className="w-5 h-5 text-[var(--fg)]" />
          </button>
        </div>

        {label && (
          <div className="mb-4 p-3 rounded-lg neumo-inset">
            <p className="text-xs text-[var(--fg)] opacity-50 uppercase tracking-wider mb-1">
              Identification Label
            </p>
            <p className="text-base font-medium text-[var(--fg)]">{label}</p>
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <div className="neumo-inset rounded-[var(--radius-md)] p-4 bg-white">
            {qrImageUrl && (
              <img
                src={qrImageUrl}
                alt={`QR Code for ${title}`}
                className="w-64 h-64 sm:w-80 sm:h-80"
              />
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-[var(--fg)] opacity-50 uppercase tracking-wider mb-2">
            Direct URL
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg neumo-inset">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 bg-transparent text-sm text-[var(--fg)] opacity-70 outline-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[var(--fg)] opacity-50 mb-3">
            Scan this QR code with a mobile device or tablet to access the {title.toLowerCase()} in real-time.
            All updates sync automatically.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={downloadQRCode}
            >
              <Download className="w-4 h-4" />
              <span>Download QR Code</span>
            </Button>
            <Button
              variant="soft"
              size="md"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
