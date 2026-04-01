// Real email templates from backend
// notification-service & user-service

export interface OrderConfirmationParams {
  orderNumber: string;
  items: { name: string; qty: number; unitPrice: number }[];
  total: number;
  commissionAmount: number;
  orderUrl: string;
}

export function orderConfirmationTemplate(p: OrderConfirmationParams): string {
  const rows = p.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${(item.unitPrice / 100).toFixed(2)} €</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#ede9fe;font-size:14px;">Confirmation de commande</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;color:#374151;font-size:16px;">
                Merci pour votre commande ! Voici le récapitulatif.
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">
                Commande n°
              </p>
              <p style="margin:0 0 24px;color:#111827;font-size:18px;font-weight:700;">${p.orderNumber}</p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <thead>
                  <tr style="background:#f3f4f6;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Article</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Qté</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Prix</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px;">Commission plateforme</td>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px;text-align:right;">${(p.commissionAmount / 100).toFixed(2)} €</td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0;color:#111827;font-size:16px;font-weight:700;border-top:2px solid #e5e7eb;">Total</td>
                  <td style="padding:8px 0 0;color:#111827;font-size:16px;font-weight:700;text-align:right;border-top:2px solid #e5e7eb;">${(p.total / 100).toFixed(2)} €</td>
                </tr>
              </table>

              <a href="${p.orderUrl}"
                 style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
                Voir ma commande
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© Craftea — Marché artisanal en ligne</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface StripeKycInviteParams {
  artistName: string;
  onboardingUrl: string;
}

export function stripeKycInviteTemplate(p: StripeKycInviteParams): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#ede9fe;font-size:14px;">Vérification de votre identité</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">
                Bonjour <strong>${p.artistName}</strong>,
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                Pour commencer à recevoir des paiements sur Craftea, nous devons vérifier votre identité via notre partenaire de paiement sécurisé Stripe.
              </p>
              <p style="margin:0 0 32px;color:#374151;font-size:15px;">
                Cette étape est obligatoire et ne prend que quelques minutes. Vos informations sont transmises de manière chiffrée.
              </p>
              <a href="${p.onboardingUrl}"
                 style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
                Vérifier mon identité
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© Craftea — Marché artisanal en ligne</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface StripeKycConfirmedParams {
  artistName: string;
}

export function stripeKycConfirmedTemplate(p: StripeKycConfirmedParams): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#059669;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#d1fae5;font-size:14px;">Identité vérifiée avec succès</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <!-- Success icon -->
              <div style="width:56px;height:56px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 0 24px;text-align:center;line-height:56px;font-size:28px;">
                ✓
              </div>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">
                Bonjour <strong>${p.artistName}</strong>,
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                Bonne nouvelle ! Votre identité a été <strong style="color:#059669;">vérifiée avec succès</strong> par Stripe.
              </p>
              <p style="margin:0 0 0;color:#374151;font-size:15px;">
                Vous pouvez maintenant recevoir des paiements directement sur votre compte bancaire. Les virements seront déclenchés automatiquement après chaque vente.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© Craftea — Marché artisanal en ligne</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface PayoutSentParams {
  amount: number;
  currency: string;
  estimatedDays: number;
}

export function payoutSentTemplate(p: PayoutSentParams): string {
  const formatted = (p.amount / 100).toFixed(2);
  const currency = p.currency.toUpperCase();

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#dbeafe;font-size:14px;">Virement initié</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;color:#374151;font-size:16px;">
                Votre virement a été initié avec succès.
              </p>
              <!-- Amount highlight -->
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#3b82f6;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Montant viré</p>
                <p style="margin:0;color:#1d4ed8;font-size:32px;font-weight:700;">${formatted} ${currency}</p>
              </div>
              <p style="margin:0;color:#6b7280;font-size:14px;">
                Les fonds devraient apparaître sur votre compte bancaire dans
                <strong>${p.estimatedDays} jour${p.estimatedDays > 1 ? 's' : ''} ouvré${p.estimatedDays > 1 ? 's' : ''}</strong>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© Craftea — Marché artisanal en ligne</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface PayoutFailedParams {
  amount: number;
  currency: string;
}

export function payoutFailedTemplate(p: PayoutFailedParams): string {
  const formatted = (p.amount / 100).toFixed(2);
  const currency = p.currency.toUpperCase();

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#dc2626;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#fecaca;font-size:14px;">Échec du virement</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;color:#374151;font-size:16px;">
                Nous n'avons pas pu effectuer votre virement.
              </p>
              <!-- Amount highlight -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#ef4444;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Montant concerné</p>
                <p style="margin:0;color:#b91c1c;font-size:32px;font-weight:700;">${formatted} ${currency}</p>
              </div>
              <p style="margin:0 0 16px;color:#374151;font-size:14px;">
                Causes possibles :
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.6;">
                <li>Coordonnées bancaires incorrectes ou expirées</li>
                <li>Compte bancaire non éligible aux virements Stripe</li>
                <li>Problème temporaire chez votre banque</li>
              </ul>
              <p style="margin:0;color:#374151;font-size:14px;">
                Connectez-vous à votre tableau de bord Craftea pour mettre à jour vos informations bancaires. Notre équipe support est disponible si vous avez besoin d'aide.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© Craftea — Marché artisanal en ligne</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface ResetPasswordParams {
  resetUrl: string;
}

export function resetPasswordTemplate(p: ResetPasswordParams): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#ede9fe;font-size:14px;">Réinitialisation du mot de passe</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">
                Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
              </p>
              <p style="margin:0 0 32px;color:#6b7280;font-size:14px;">
                Ce lien est valable <strong>30 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
              </p>
              <a href="${p.resetUrl}"
                 style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
                Réinitialiser mon mot de passe
              </a>
              <p style="margin:32px 0 0;color:#9ca3af;font-size:12px;word-break:break-all;">
                Ou copiez ce lien : ${p.resetUrl}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© Craftea — Marché artisanal en ligne</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
