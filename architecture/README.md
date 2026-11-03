# Architekturmodell

Wer mit wem spricht, wozu und mit welchen Daten. Modelliert mit [LikeC4](https://likec4.dev).

| Datei | Inhalt |
|---|---|
| `specification.c4` | Elementarten und Tags: `#pii` personenbezogene Daten, `#async` über RabbitMQ, `#brb` `#nbc` `#thr` `#dbc` nur bei diesem Mandanten, `#split` auf beide Clients verteilt, `#dead` Pfad ohne Seite, `#disabled`, `#dev` |
| `svs.c4` | Dienste mit ihren Deployments und Jobs, Datenspeicher, RabbitMQ-Exchanges |
| `external.c4` | Externe Systeme |
| `pages.c4` | Fachbereiche von nuxt-client, schulcloud-client und tldraw-client mit ihren Pfaden |
| `flows.c4` | Alle Verbindungen. Jede nennt Zweck, Technik und die Quelle im Code oder in der Konfiguration. |
| `views.c4` | Sichten: Übersicht, Dienste, Server-Rollen, Seiten, Migration, Datenschutz, RabbitMQ, file-storage, Login, je Mandant |

## Ansehen

```bash
npx likec4@1.60.0 start architecture
```

In VS Code zeigt die Erweiterung „LikeC4“ die Vorschau beim Bearbeiten.

## Ändern

Eine neue Verbindung zu einem Dienst, Datenspeicher oder externen System kommt im selben PR in `flows.c4`.
Wenn personenbezogene Daten fließen: Tag `#pii` setzen und die Kategorien in `description` nennen
(`'Personenbezogene Daten: …'`). Metadaten von Beziehungen liefert der MCP-Server nicht aus.
Zieht eine Seite in den nuxt-client um, wandert ihr Pfad in `pages.c4` vom Legacy-Bereich zum nuxt-Bereich.

```bash
npx likec4@1.60.0 validate architecture
```

## Stand und Grenzen

Erstellt aus Code und Konfiguration (Ansible-Rollen, Ingress, App-Einstiegspunkte, Router). Nicht geprüft:
Ref- und Prod-Abweichungen vom Dev-Setup, die genauen Datenkategorien je Verbindung, und welche Seiten
welche Endpunkte im Einzelnen rufen. Seiten sind zu Fachbereichen zusammengefasst, nicht einzeln modelliert.
