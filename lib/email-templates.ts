// Email templates for preview
// These are copied from the backend and adapted for frontend preview

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

  const total = (p.total / 100).toFixed(2);
  const commission = (p.commissionAmount / 100).toFixed(2);

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
                    <th style="padding:8px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.3px;">Produit</th>
                    <th style="padding:8px 12px;text-align:center;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.3px;">Qté</th>
                    <th style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.3px;">Prix</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>

              <!-- Total -->
              <div style="text-align:right;margin-bottom:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
                  Total : <strong style="color:#374151;">${total} €</strong>
                </p>
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  Commission déduite : ${commission} €
                </p>
              </div>

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
            <td style="background:#10b981;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Craftea</h1>
              <p style="margin:4px 0 0;color:#d1fae5;font-size:14px;">Identité vérifiée ✓</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:48px;margin-bottom:12px;">✓</div>
                <h2 style="margin:0;color:#059669;font-size:20px;font-weight:700;">Vérification réussie</h2>
              </div>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;">
                Bonjour <strong>${p.artistName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;">
                Votre identité a été vérifiée avec succès. Vous pouvez maintenant recevoir des paiements directement sur votre compte bancaire.
              </p>
              <p style="margin:0;color:#6b7280;font-size:14px;">
                Bienvenue dans la famille des artisans Craftea ! 🎨
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
              <p style="margin:4px 0 0;color:#fee2e2;font-size:14px;">Virement échoué</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;color:#374151;font-size:16px;">
                Nous avons rencontré une erreur lors du virement de vos fonds.
              </p>
              <!-- Amount highlight -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#dc2626;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Montant concerné</p>
                <p style="margin:0;color:#7f1d1d;font-size:32px;font-weight:700;">${formatted} ${currency}</p>
              </div>
              <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
                Vos fonds restent sécurisés dans votre portefeuille. Veuillez :
              </p>
              <ul style="margin:0 0 24px;padding-left:24px;color:#6b7280;font-size:14px;">
                <li style="margin-bottom:8px;">Vérifier les détails de votre compte bancaire</li>
                <li style="margin-bottom:8px;">Vous assurer que votre compte est toujours actif</li>
                <li>Contacter notre support si le problème persiste</li>
              </ul>
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
  expiresInHours: number;
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
                Vous avez demandé une réinitialisation de votre mot de passe.
              </p>
              <p style="margin:0 0 32px;color:#374151;font-size:15px;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expire dans <strong>${p.expiresInHours} heures</strong>.
              </p>
              <a href="${p.resetUrl}"
                 style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
                Réinitialiser mon mot de passe
              </a>
              <p style="margin:24px 0 0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;">
                Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Si vous avez des questions, contactez-nous.
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
