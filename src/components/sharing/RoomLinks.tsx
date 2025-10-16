import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Copy, Monitor, HelpCircle, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { QRCodeModal } from './QRCodeModal';

interface RoomLinksProps {
  roomSlug: string;
  roomName?: string;
}

export function RoomLinks({ roomSlug, roomName = 'Event' }: RoomLinksProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);
  const [stageLabel, setStageLabel] = useState('');
  const [qaLabel, setQaLabel] = useState('');
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    label: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    label: '',
  });

  const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const links = {
    control: `${baseUrl}/room/${roomSlug}/control`,
    stage: `${baseUrl}/room/${roomSlug}/stage`,
    qa: `${baseUrl}/room/${roomSlug}/qa`,
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openQRModal = (type: 'stage' | 'qa') => {
    const config = {
      stage: {
        url: links.stage,
        title: t('sharing.stageDisplay'),
        label: stageLabel || `${roomName} - ${t('sharing.stageDisplay')}`,
      },
      qa: {
        url: links.qa,
        title: t('sharing.qaSubmission'),
        label: qaLabel || `${roomName} - ${t('qa.titleShort')}`,
      },
    };

    setQrModal({
      isOpen: true,
      ...config[type],
    });
  };

  const closeQRModal = () => {
    setQrModal({ isOpen: false, url: '', title: '', label: '' });
  };

  return (
    <>
      <Card>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Link2 className="w-6 h-6" />
          {t('sharing.roomLinks')}
        </h3>

        <div className="space-y-3">
          <div className="p-3 rounded-lg neumo-inset">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm font-medium">{t('sharing.stageDisplay')}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={links.stage}
                readOnly
                className="flex-1 bg-transparent text-sm text-[var(--fg)] opacity-70 outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(links.stage, 'stage')}
              >
                {copied === 'stage' ? (
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg neumo-inset">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm font-medium">{t('sharing.qaSubmission')}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={links.qa}
                readOnly
                className="flex-1 bg-transparent text-sm text-[var(--fg)] opacity-70 outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(links.qa, 'qa')}
              >
                {copied === 'qa' ? (
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--fg)] border-opacity-10">
            <p className="text-xs text-[var(--fg)] opacity-50 mb-3 uppercase tracking-wider">
              {t('sharing.qrGeneration', { defaultValue: 'Geração de Código QR' })}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--fg)] opacity-70 mb-1.5 block">
                  {t('sharing.stageDisplayLabel', { defaultValue: 'Etiqueta do Ecrã de Palco (Opcional)' })}
                </label>
                <Input
                  value={stageLabel}
                  onChange={setStageLabel}
                  placeholder={`${roomName} - ${t('sharing.stageDisplay')}`}
                  className="mb-2"
                />
                <Button
                  variant="soft"
                  size="md"
                  className="w-full"
                  onClick={() => openQRModal('stage')}
                >
                  <QrCode className="w-5 h-5" />
                  <span>{t('sharing.generateQRStage', { defaultValue: 'Gerar Código QR para Ecrã de Palco' })}</span>
                </Button>
              </div>

              <div>
                <label className="text-xs text-[var(--fg)] opacity-70 mb-1.5 block">
                  {t('sharing.qaLabel', { defaultValue: 'Etiqueta de P&R (Opcional)' })}
                </label>
                <Input
                  value={qaLabel}
                  onChange={setQaLabel}
                  placeholder={`${roomName} - ${t('qa.titleShort')}`}
                  className="mb-2"
                />
                <Button
                  variant="soft"
                  size="md"
                  className="w-full"
                  onClick={() => openQRModal('qa')}
                >
                  <QrCode className="w-5 h-5" />
                  <span>{t('sharing.generateQRQA', { defaultValue: 'Gerar Código QR para P&R' })}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={closeQRModal}
        url={qrModal.url}
        title={qrModal.title}
        label={qrModal.label}
        roomName={roomName}
      />
    </>
  );
}
