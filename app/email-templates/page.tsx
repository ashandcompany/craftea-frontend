'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  orderConfirmationTemplate,
  stripeKycInviteTemplate,
  stripeKycConfirmedTemplate,
  payoutSentTemplate,
  payoutFailedTemplate,
  resetPasswordTemplate,
} from '@/lib/email-templates';

interface Template {
  id: string;
  label: string;
  description: string;
  render: () => string;
}

const templates: Template[] = [
  {
    id: 'order-confirmation',
    label: 'Confirmation de Commande',
    description: 'Email envoyé après une commande réussie',
    render: () =>
      orderConfirmationTemplate({
        orderNumber: 'CMD-2026-001',
        items: [
          { name: 'Poterie Artisanale 🏺', qty: 1, unitPrice: 4999 },
          { name: 'Céramique Peinte à Main 🎨', qty: 2, unitPrice: 2499 },
        ],
        total: 9997,
        commissionAmount: 999,
        orderUrl: 'http://localhost:3000/orders/CMD-2026-001',
      }),
  },
  {
    id: 'kyc-invite',
    label: 'Invitation KYC Stripe',
    description: 'Demande de vérification d\'identité pour artiste',
    render: () =>
      stripeKycInviteTemplate({
        artistName: 'Marie Dupont',
        onboardingUrl: 'https://connect.stripe.com/onboarding/acct_1234567890',
      }),
  },
  {
    id: 'kyc-confirmed',
    label: 'KYC Vérifié',
    description: 'Confirmation de vérification d\'identité',
    render: () =>
      stripeKycConfirmedTemplate({
        artistName: 'Marie Dupont',
      }),
  },
  {
    id: 'payout-sent',
    label: 'Virement Initié',
    description: 'Confirmation d\'un virement vers le compte bancaire',
    render: () =>
      payoutSentTemplate({
        amount: 15000,
        currency: 'eur',
        estimatedDays: 3,
      }),
  },
  {
    id: 'payout-failed',
    label: 'Virement Échoué',
    description: 'Notification d\'échec de virement',
    render: () =>
      payoutFailedTemplate({
        amount: 10000,
        currency: 'eur',
      }),
  },
  {
    id: 'reset-password',
    label: 'Réinitialisation du Mot de Passe',
    description: 'Lien de réinitialisation du mot de passe',
    render: () =>
      resetPasswordTemplate({
        resetUrl: 'http://localhost:3000/reset-password?token=abc123def456',
        expiresInHours: 24,
      }),
  },
];

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('order-confirmation');

  const selectedData = templates.find((t) => t.id === selectedTemplate);

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
              <h1 className="text-3xl font-bold text-gray-900">Templates d'Email</h1>
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

                {/* Email Preview */}
                <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                  <div
                    className="bg-white rounded"
                    dangerouslySetInnerHTML={{ __html: selectedData.render() }}
                  />
                </div>

                {/* HTML Code */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Voir le HTML brut
                  </summary>
                  <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                    <code>{selectedData.render()}</code>
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
