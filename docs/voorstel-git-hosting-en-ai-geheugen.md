# Voorstel: git-hosting en AI-geheugen

**Status:** voorstel, ter beoordeling door de homelab-architect en Mark
**Datum:** 9 november 2026
**Opgesteld door:** Claude Code, op verzoek van Mark

## Aanleiding

Op 9 november 2026 is het GitHub-account `atelierbakema` aangemaakt en gevuld met:

- forks van Sandy Noble's Polargraph-repo's (`github.com/euphy`), plus een archief van alle wiki's en git-backups in `atelierbakema/polargraph` (zie [README](../README.md) en [archive/README.md](../archive/README.md));
- een privé-repo met de documentatie van het homelab.

Binnen een paar uur heeft het abuse-detectiesysteem van GitHub het account gemarkeerd. Waarschijnlijk kwam dat door de combinatie van een gloednieuw account, forks, geautomatiseerde pushes door een AI-assistent, het aanzetten van 2FA en mislukte inlogpogingen. Daarna:

- kon Mark niet meer inloggen;
- waren de repo's tijdelijk onbereikbaar, ook voor Claude;
- volgde handmatige controle door GitHub Support. Die loopt nog. De repo's lijken inmiddels weer bereikbaar.

**Les:** de homelab-documentatie stond alleen op GitHub. Eén automatische blokkade was genoeg om er niet meer bij te kunnen. GitHub is een goede plek om te delen, maar geen betrouwbare enige opslagplek.

## Doelen

1. **Eigendom:** alle code en documentatie staat op een plek die Mark zelf beheert.
2. **Weerbaarheid:** een blokkade of storing bij één aanbieder kost nooit toegang tot eigen data (3-2-1-regel).
3. **AI-samenwerking:** Claude (en later eventueel andere aanbieders of een lokaal model) kan in de repo's werken.
4. **Draagbaar AI-geheugen:** werkwijzen, beslissingen, logs en ideeën staan als leesbare tekst in git. Dat geheugen is leesbaar voor Mark en bruikbaar voor elke AI-aanbieder.

## Voorstel

### 1. Eigen git-server in het homelab: Forgejo

- **Forgejo** is een lichte, open-source git-server, vergelijkbaar met GitHub, en draait in één Docker-container. Gitea is een alternatief.
- In **fase 1** trekt Forgejo automatisch kopieën van alle GitHub-repo's (**pull mirror**, bijvoorbeeld elk uur). GitHub blijft de werkplek, Forgejo is de kluis.
- In **fase 2**, als Claude Code vooral lokaal draait of er een lokaal model is, wordt Forgejo de hoofdplek. Openbare repo's worden dan automatisch doorgezet naar GitHub en/of Codeberg (**push mirror**), en GitHub wordt de etalage.
- Privé-repo's, zoals de homelab-documentatie, staan in fase 2 alleen in Forgejo.

### 2. Rol per platform

| Platform | Rol | Inhoud |
|---|---|---|
| Forgejo (homelab) | Kluis (fase 1) → hoofdplek (fase 2) | Alles |
| GitHub | Werkplek voor Claude in de cloud (fase 1) → etalage (fase 2) | Openbare projecten |
| Codeberg (optioneel) | Europese, non-profit extra kopie | Openbare open-source projecten |
| Externe schijf / cloudopslag | Derde kopie | Backup van de Forgejo-data |

### 3. Draagbaar AI-geheugen

Een aparte repo (werknaam `geheugen` of `atelier-brain`) met gewone Markdown:

```
AGENTS.md        # instructies voor elke AI-assistent (open standaard, aanbieder-onafhankelijk)
CLAUDE.md        # één regel: "Lees AGENTS.md"
README.md        # uitleg voor mensen: wat staat waar, hoe werkt het
decisions/       # genummerde beslissingen (ADR's): wat, waarom, alternatieven
logs/            # logboek per werksessie: wat is gedaan, wat staat open
ideas/           # ideeën en plannen
projects/        # per project een korte stand van zaken (bijv. polargraph.md)
```

- Het systeem legt zichzelf uit: `README.md` voor mensen, `AGENTS.md` voor AI.
- Het is niet afhankelijk van een aanbieder. `AGENTS.md` wordt gelezen door onder meer Claude Code, Codex, Cursor en Gemini CLI, en een lokaal model kan dezelfde bestanden gebruiken.
- Het staat in git, dus elke wijziging is terug te zien en terug te draaien.

## Wat werkt met Claude, en wat niet

| Situatie | Werkt met Forgejo? |
|---|---|
| Claude Code lokaal (laptop of homelab) | Ja, volledig. Het is gewone git (clone, commit, push). |
| Claude Code in de cloud (claude.ai/code) | Nog niet goed. Cloudsessies krijgen hun repo's via GitHub, en een Forgejo-server thuis is daar niet zonder meer bereikbaar. Daarom blijft GitHub in fase 1 de werkplek. |
| Pull requests, issues en reviews via de GitHub-app | Alleen op GitHub. Voor Forgejo bestaan community-koppelingen (MCP-servers); die moeten nog worden beoordeeld. |

## Lessen voor GitHub-gebruik

- Een nieuw account met veel geautomatiseerde activiteit kan worden gemarkeerd. Doe de eerste weken geen grote bulk-pushes en verander niet tegelijk beveiligingsinstellingen.
- Automatisering via AI is toegestaan op een persoonlijk account, zolang een mens het account heeft aangemaakt en verantwoordelijk is voor wat er gebeurt.
- Bewaar geen geheimen (wachtwoorden, API-keys, sleutels) in git. Die horen in 1Password of een secrets-manager.

## Open vragen voor de architect

1. Op welke hardware en software draait het homelab (Proxmox, Unraid, Synology, Docker-host)? Waar komt Forgejo te draaien?
2. Hoe wordt de Forgejo-data zelf geback-upt (snapshot, externe schijf, offsite)?
3. Moet Forgejo van buitenaf bereikbaar zijn (bijv. via Tailscale of een reverse proxy), zodat ook Claude in de cloud erbij kan? Wat zijn de veiligheidsrisico's?
4. Codeberg erbij als extra openbare kopie: ja of nee?
5. Komt het AI-geheugen in één centrale repo of per project? En wat mag een AI daar zelf in schrijven zonder goedkeuring?
6. Wanneer is het moment voor fase 2, de overstap naar Forgejo als hoofdplek?

## Voorgestelde volgende stappen

1. GitHub-review afronden (antwoord aan GitHub Support is verstuurd).
2. Forgejo installeren in het homelab, met pull mirrors van alle GitHub-repo's.
3. Backup van de Forgejo-data inrichten.
4. Geheugen-repo opzetten met `AGENTS.md`, `README.md` en de eerste beslissing: dit voorstel.
5. Na een paar weken evalueren en besluiten over fase 2.
