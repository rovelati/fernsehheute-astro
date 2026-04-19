/**
 * CF Pages Function — /programm/*
 *
 * These detail pages were removed from the site. Return 410 Gone so that
 * Google de-indexes them quickly (faster than 404 for permanently-removed content).
 */
export async function onRequest() {
  const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Seite nicht mehr verfügbar — FernsehHeute</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 9999px;
      padding: .25rem .875rem;
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }
    h1 { font-size: clamp(1.5rem, 4vw, 2.25rem); font-weight: 800; color: #f1f5f9; }
    p  { margin-top: .75rem; color: #94a3b8; max-width: 38ch; line-height: 1.6; }
    .actions { margin-top: 2rem; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; }
    a {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      padding: .6rem 1.5rem;
      font-size: .875rem;
      font-weight: 600;
      text-decoration: none;
      transition: background .15s, color .15s;
    }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { border: 1px solid #334155; color: #cbd5e1; }
    .btn-secondary:hover { border-color: #64748b; color: #f1f5f9; }
  </style>
</head>
<body>
  <span class="badge">410 Gone</span>
  <h1>Diese Seite existiert nicht mehr</h1>
  <p>
    Die Programm-Detailseite wurde dauerhaft entfernt.<br />
    Das aktuelle TV-Programm findest du auf der Startseite.
  </p>
  <div class="actions">
    <a href="/" class="btn-primary">Zur Startseite</a>
    <a href="/zdf/" class="btn-secondary">ZDF Programm</a>
    <a href="/das-erste/" class="btn-secondary">Das Erste Programm</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
