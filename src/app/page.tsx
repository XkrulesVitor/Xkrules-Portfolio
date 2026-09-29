import { HOTSPOTS } from '@/content/hotspots'
import { SITE, UI_TEXT } from '@/content/site'
import { ExperienceLoader } from '@/experience/ExperienceLoader'

// Server Component: SEO + fallback sem JS. A experiência 3D entra via ExperienceLoader (client).
export default function Home() {
  return (
    <main>
      <h1 className="sr-only">{SITE.title}</h1>
      <p className="sr-only">{SITE.description}</p>
      <noscript>
        <div className="fixed inset-0 z-50 overflow-auto bg-bg-canvas p-8 text-ink">
          <h2 className="text-xl font-semibold">{SITE.title}</h2>
          <p className="mt-3">{UI_TEXT.noscript.intro}</p>
          <p className="mt-6 font-medium">{UI_TEXT.noscript.sections}</p>
          <ul className="mt-2 list-disc pl-6">
            {HOTSPOTS.map((h) => (
              <li key={h.id}>
                {h.label}: {h.description}
              </li>
            ))}
          </ul>
          {SITE.links.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-4">
              {SITE.links.map((l) => (
                <li key={l.href}>
                  <a className="underline" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </noscript>
      <ExperienceLoader />
    </main>
  )
}
