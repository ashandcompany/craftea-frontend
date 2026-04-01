'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  label: string;
  description: string;
}

const templates: Template[] = [
  {
    id: 'order-confirmation',
    label: 'Confirmation de Commande',
    description: "Email envoyé après une commande réussie",
  },
  {
    id: 'kyc-invite',
    label: 'Invitation KYC Stripe',
    description: "Demande de vérification d'identité pour artiste",
  },
  {
    id: 'kyc-confirmed',
    label: 'KYC Vérifié',
    description: "Confirmation de vérification d'identité",
  },
  {
    id: 'payout-sent',
    label: 'Virement Initié',
    description: "Confirmation d'un virement vers le compte bancaire",
  },
  {
    id: 'payout-failed',
    label: 'Virement Échoué',
    description: "Notification d'échec de virement",
  },
  {
    id: 'reset-password',
    label: 'Réinitialisation du Mot de Passe',
    description: "Lien de réinitialisation du mot de passe",
  },
];

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('order-confirmation');
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedData = templates.find((t) => t.id === selectedTemplate);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/email-preview/${selectedTemplate}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setHtml(text);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [selectedTemplate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-violet-600 hover:text-violet-700 text-sm font-medium mb-2 inline-block">
                ← Accueil
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Templates d&apos;Email</h1>
              <p className="text-gray-600 mt-1">Visualisez tous les templates de notification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow divide-y sticky top-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${
                    selectedTemplate === template.id ? 'bg-violet-50 border-l-4 border-violet-600' : ''
                  }`}
                >
                  <div className={`font-medium ${
                    selectedTemplate === template.id ? 'text-violet-600' : 'text-gray-900'
                  }`}>
                    {template.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-3">
            {selectedData && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedData.label}</h2>
                  <p className="text-gray-600 mt-1">{selectedData.description}</p>
                </div>

                {loading && (
                  <div className="border rounded-lg bg-gray-50 flex items-center justify-center" style={{ minHeight: 400 }}>
                    <p className="text-gray-500 text-sm">Chargement depuis le backend…</p>
                  </div>
                )}

                {error && (
                  <div className="border border-red-200 rounded-lg bg-red-50 p-6">
                    <p className="text-red-700 font-medium text-sm">Impossible de récupérer le template</p>
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                    <p className="text-gray-500 text-xs mt-3">
                      Assurez-vous que le backend est démarré (<code>docker-compose up notification-service user-service api-gateway</code>).
                    </p>
                  </div>
                )}

                {!loading && !error && html && (
                  <>
                    {/* Email Preview via iframe */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <EmailPreview html={html} />
                    </div>

                    {/* HTML Code */}
                    <details className="mt-6">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        Voir le HTML brut
                      </summary>
                      <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                        <code>{html}</code>
                      </pre>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher le mail dans une iframe avec les vrais styles
function EmailPreview({ html }: { html: string }) {
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (iframeRef) {
      const doc = iframeRef.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        // Adapter la hauteur de l'iframe au contenu
        setTimeout(() => {
          const height = iframeRef.contentDocument?.documentElement.scrollHeight || 600;
          iframeRef.style.height = `${height + 20}px`;
        }, 100);
      }
    }
  }, [html, iframeRef]);

  return (
    <iframe
      ref={setIframeRef}
      title="Email Preview"
      style={{
        width: '100%',
        minHeight: '600px',
        border: 'none',
        overflow: 'hidden',
      }}
    />
  );
}
