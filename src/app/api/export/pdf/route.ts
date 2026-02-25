import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { html, filename = 'rapport.pdf', title = 'Rapport', period = '' } = await req.json()

  const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #1F2937; background: #fff; }
  .header { border-bottom: 2px solid #7C3AED; padding: 20px 24px 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-title { font-size: 18px; font-weight: 700; color: #111827; }
  .header-sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
  .header-logo { font-size: 11px; color: #7C3AED; font-weight: 600; text-align: right; }
  .content { padding: 20px 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  thead { background: #F9FAFB; }
  th { padding: 8px 12px; text-align: left; font-weight: 600; color: #6B7280; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #E5E7EB; }
  td { padding: 8px 12px; border-bottom: 1px solid #F3F4F6; }
  tr:nth-child(even) { background: #FAFAFA; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #E5E7EB; padding: 8px 24px; font-size: 10px; color: #9CA3AF; display: flex; justify-content: space-between; background: white; }
  h2 { font-size: 14px; font-weight: 600; color: #111827; margin: 20px 0 8px; }
  h3 { font-size: 13px; font-weight: 600; color: #374151; margin: 16px 0 6px; }
  p { line-height: 1.6; color: #374151; margin-bottom: 8px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .kpi-card { border: 1px solid #E5E7EB; border-radius: 4px; padding: 12px; }
  .kpi-label { font-size: 11px; color: #6B7280; margin-bottom: 4px; }
  .kpi-value { font-size: 20px; font-weight: 700; color: #111827; }
  .badge { display: inline-flex; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 500; }
  .badge-green { background: #DCFCE7; color: #16A34A; }
  .badge-red { background: #FEE2E2; color: #DC2626; }
  .badge-amber { background: #FEF3C7; color: #D97706; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="header-title">${title}</div>
    <div class="header-sub">${period}</div>
  </div>
  <div class="header-logo">Orchidée Nature<br/>Management System</div>
</div>
<div class="content">
${html}
</div>
<div class="footer">
  <span>Généré par Orchidée Nature Management System — ${new Date().toLocaleString('fr-FR')}</span>
  <span>Confidentiel</span>
</div>
</body>
</html>`

  return new NextResponse(fullHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
