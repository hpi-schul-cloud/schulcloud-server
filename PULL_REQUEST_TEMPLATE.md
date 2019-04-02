---
labels: ["WIP"]
---

# Checkliste

- Bis die komplette Checkliste abgearbeitet ist muss das PR-Label WIP gesetzt sein

## Allgemein
- [ ] Links zu verwandten PRs anderer Repositories
  - https://github.com/schul-cloud/schulcloud-client/pulls/????
  - Im Ticket (oder PR, wenn kein Ticket): Beschreibung und Begründung der Änderung/Neuerungen
- [ ] Link zum Ticket https://ticketsystem.schul-cloud.org/browse/SC-????

## Code Qualität
- [ ] Code mit Hinblick auf Security und Datensicherheit betrachten
- [ ] Linter darf keine Probleme bei veränderten Dateien aufweisen
- [ ] Kern-Logik ist hinter der API implementiert?

## Tests
- [ ] Test-Coverage darf durch PR nicht sinken
- [ ] Unit-Tests und Integrations-Tests schreiben / ändern
- [ ] Keine offenen bekannten Bugs im entwickelten Code

## Deployable
- [ ] Feature Toggle notwendig (z.B. Environment-Variablen)
- [ ] Datenbankanpassungen notwendig / Migrationsskripte
  - Alle DB-Anpassungen müssen in den Seed-Daten reflektiert werden
- [ ] Notwendige neue Konfiguration an der Infrastruktur wurde mit Dev-Ops besprochen

## Dokumentation
- [ ] Neue Abhängigkeiten (Repos, NPM Pakete, Vendor Skripte) begründen und überprüfen (Stabilität, Performance, Aktualität, Autor)
  - Begründung:
- [ ] Übergabe/Schulung & Administrationsinfos (#Busfaktor, Confluence intern)
- [ ] Dokumentation (wenn notwendig)
  - Code
  - Swagger
  - Confluence - https://docs.schul-cloud.org
  - Guidelines / Hilfe
  - Release Notes - wenn es sich um große Feature-Releases handelt
- [ ] mind. 1 Screenshot bei Content-Änderungen

## Datenschutz
- [ ] Model- / Seedänderungen erfordern Review der Datenschutz-Gruppen (wird automatisch hinzugefügt)
- [ ] Neue Verarbeitung von personenbezogene Daten wurde mit der Datenschutz-Gruppe besprochen

## Freigabe zum Review
- [ ] WIP PR-Label entfernt, wenn die Checkliste abgearbeitet wurde

## Mehr
Weitere Informationen zur DoD [hier im Confluence](https://docs.schul-cloud.org/pages/viewpage.action?pageId=92831762)
