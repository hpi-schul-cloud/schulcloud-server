# Copilot Instructions

## Grundlagen Technologie
Wir nutzen nodejs mit typescript. Prüfe hierbei die in der package.json angegebenen Versionen und beachte diese bei den Code vorschlägen.

Unser Framework ist nestjs, siehe dazu https://docs.nestjs.com/.

Als Anbindung an eine MongoDB Datenbank verwenden wir mikroORM, siehe dazu https://mikro-orm.io/docs/guide.

Zum tracken der Änderungen verwenden wir Jira.

## Allgemeine Informationen

Wenn du Code vorschläge machst, bitte beachte die folgenden Konvensionen aus dem Bereich ## Code Style.

## Code Style

### Tests
Wir verwenden jest (siehe: https://jestjs.io/) als Testframework.

Wir verwenden @golevelup/ts-jest (siehe: https://github.com/golevelup/nestjs#readme), für das Erstellen der Mocks soll es immer bevorzugt vor jest verwendet werden.

Beachte das erste describe enthält den Namen der Klasse, oder Funktion die getestet werden soll.
Ein tiefer geschachteltes describe enthält die Methode der Klasse die getestet werden soll.
Hierbei beachte das die Struktur der Test für die Methode unterteilt ist mit describe('when
Welches jeweils eine Ausgangslage beschreibt, die in der Funktion const setup darunter definiert wird und in den it Blöcken danach verwendet.
Es darf mehre it Blöcke geben die einzelne Teile testen.

Mocks sind immer Teil der setup Methode.

Spy kann im setup, oder im it Block verwendet werden.

Zwischen Arrange Act Assert im it Block haben wir immer eine Leerzeile.
Zwischen jedem it kommt eine Leerzeile.

Wir verwenden Once bei den mocks. Wird ein mock mehrfach aufgerufen soll mehrfach der Mock mit Once gesetzt werden. Zum Beispiel mockResolveValueOnce anstatt mockResolveValue.

Mocks werden bei uns immer durch das hinzufügen von afterEach und jest.resetAllMocks(); zurück gesetzt, welches einmalig pro File so gesetzt wird, das es alle Test betrifft.

Sollte die Klasse für die du Test erstellst mit einem Decorator von Nest versehen sein zum Beispiel @Injectable(). Dann erstelle nach dem ersten describe ein beforeAll mit module = await Test.createTestingModule welches mit compile() initalisiert wird.
Alle im constructor der zu testenden Klasse injecteten Klassen sollen for dem beforeAll als let <name> mit einem golevelup mock hinterlegt werden und nach dem compile() im beforeAll zugewiesen werden mit module.get(<name>)

### Cleancode
Wir folgen den Prinzipien von Clean Code, um lesbaren, wartbaren und erweiterbaren Code zu schreiben. Beachte dabei die folgenden Punkte:

- **Lesbarkeit**:
  - Schreibe Code, der leicht verständlich ist, auch für Entwickler, die ihn nicht geschrieben haben.
  - Verwende aussagekräftige Namen für Variablen, Funktionen und Klassen.

- **Einfachheit**:
  - Vermeide unnötige Komplexität.
  - Schreibe Code, der das Problem direkt und klar löst.

- **Konsistenz**:
  - Halte dich an einheitliche Namenskonventionen, Formatierungen und Strukturen.
  - Verwende einheitliche Muster und Prinzipien im gesamten Code.

- **Kapselung**:
  - Verstecke Implementierungsdetails und stelle nur das bereit, was für die Nutzung notwendig ist.
  - Vermeide globale Zustände und Abhängigkeiten.

- **DRY (Don't Repeat Yourself)**:
  - Vermeide Duplikationen im Code.
  - Teile wiederverwendbare Logik in Funktionen, Klassen oder Modulen auf.

- **Single Responsibility Principle (SRP)**:
  - Jede Klasse, Funktion oder Methode sollte nur eine einzige Verantwortung haben.
  - Dies erleichtert das Testen, Verstehen und Ändern des Codes.

- **Testbarkeit**:
  - Schreibe Code, der leicht getestet werden kann.
  - Nutze Unit-Tests, Integrationstests und andere Testmethoden, um die Qualität sicherzustellen.

- **Kommentare sparsam verwenden**:
  - Schreibe Code, der sich selbst erklärt, anstatt viele Kommentare zu verwenden.
  - Kommentare sollten nur verwendet werden, wenn sie zusätzlichen Kontext bieten.

- **Fehlerbehandlung**:
  - Behandle Fehler klar und konsistent.
  - Logge Fehler und stelle sicher, dass sie nachvollziehbar sind.

- **Vermeide magische Zahlen und Strings**:
  - Verwende Konstanten mit aussagekräftigen Namen, um den Code verständlicher zu machen.