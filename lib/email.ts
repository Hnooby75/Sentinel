// ============================================
// lib/email.ts
// Client Resend — mode silencieux si RESEND_API_KEY absent
// ============================================

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Sentinel <noreply@sentinel-conformite.fr>'

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[email:silent] To: ${to} | Subject: ${subject}`)
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[email:error] ${res.status}: ${err}`)
    }
  } catch (err) {
    console.error('[email:error]', err)
  }
}

export async function sendAlert(to: string, subject: string, htmlContent: string): Promise<void> {
  await sendEmail(to, subject, htmlContent)
}

export async function sendNPS(to: string, entrepriseName: string): Promise<void> {
  const subject = `Comment trouvez-vous Sentinel ce mois-ci, ${entrepriseName} ?`
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #2563eb; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">SENTINEL</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Votre avis compte</p>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a; font-size: 18px;">Comment évaluez-vous Sentinel ce mois-ci ?</h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          Bonjour, votre retour nous aide à améliorer Sentinel pour ${entrepriseName}.
          Cela ne prend que 30 secondes.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sentinel-conformite.fr'}/dashboard"
            style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Donner mon avis →
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          Sentinel — Plateforme de conformité IA Act
        </p>
      </div>
    </div>
  `
  await sendEmail(to, subject, html)
}

export async function sendObligationAlert(to: string, entrepriseName: string, count: number): Promise<void> {
  const subject = `⚠️ ${count} obligation${count > 1 ? 's' : ''} en retard — ${entrepriseName}`
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Alerte Sentinel</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a;">${count} obligation${count > 1 ? 's' : ''} en retard</h2>
        <p style="color: #64748b; line-height: 1.6;">
          ${entrepriseName} a <strong>${count} obligation${count > 1 ? 's' : ''} réglementaire${count > 1 ? 's' : ''}</strong> en retard.
          Traitez-les rapidement pour éviter tout risque de non-conformité.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sentinel-conformite.fr'}/dashboard/obligations"
          style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Voir les obligations →
        </a>
      </div>
    </div>
  `
  await sendEmail(to, subject, html)
}

export async function sendImpayeAlert(to: string, entrepriseName: string, count: number): Promise<void> {
  const subject = `💸 ${count} facture${count > 1 ? 's' : ''} impayée${count > 1 ? 's' : ''} depuis +60j — ${entrepriseName}`
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #ea580c; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">💸 Alerte Impayés</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a;">${count} facture${count > 1 ? 's' : ''} en retard depuis plus de 60 jours</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Des factures de ${entrepriseName} sont impayées depuis plus de 60 jours.
          Lancez une relance ou contactez vos clients concernés.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sentinel-conformite.fr'}/dashboard/impayes"
          style="display: inline-block; background: #ea580c; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Voir les impayés →
        </a>
      </div>
    </div>
  `
  await sendEmail(to, subject, html)
}

export async function sendScoreDropAlert(to: string, entrepriseName: string, drop: number): Promise<void> {
  const subject = `📉 Score Sentinel en baisse de ${drop} pts — ${entrepriseName}`
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #7c3aed; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">📉 Alerte Score</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0f172a;">Votre score a chuté de ${drop} points ce mois</h2>
        <p style="color: #64748b; line-height: 1.6;">
          Le score de conformité de ${entrepriseName} a baissé de <strong>${drop} points</strong> par rapport au mois précédent.
          Consultez votre plan d'action pour identifier les axes à traiter en priorité.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sentinel-conformite.fr'}/dashboard/score"
          style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Voir mon score →
        </a>
      </div>
    </div>
  `
  await sendEmail(to, subject, html)
}
