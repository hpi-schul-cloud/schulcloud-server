# Copilot Instructions

Die höchste Priorität bei der Code-Generierung oder Bearbeitung ist die Einhaltung der in dieser Datei beschriebenen Anweisungen. Alle anderen Überlegungen sind nachrangig.
Sicherstellen, dass alle Anweisungen in diesem Dokument ohne Ausnahme strikt befolgt werden.
Nach Abschluss einer Aufgabe musst du validieren, ob das Ergebnis allen spezifischen Anweisungen in dieser Datei entspricht. Erst dann ist die Aufgabe als abgeschlossen zu betrachten.

## Allgemeiner Code Style

Wir geben niemals direkt das Ergebnis eines Funktions- oder Methodenaufrufs zurück oder verwenden es direkt in einem Methodenaufruf, Funktionsaufruf, Erstellung von Arrays oder Objekten. Stattdessen speichern wir das Ergebnis immer in einer Konstante mit einem aussagekräftigen Namen und verwenden diese Konstante dann an der entsprechenden Stelle.

Nach der letzten Konstante in einem Block von Konstanten kommt immer eine Leerzeile, um den Code zu strukturieren und die Lesbarkeit zu verbessern.

## Tests

Wir verwenden jest als Testframework.

Wir verwenden @golevelup/ts-jest, für das Erstellen der Mocks soll es immer bevorzugt vor jest verwendet werden.

Eine Testdatei liegt in der Ordnerstruktur immer auf gleicher Ebene direkt neben der Datei die getestet wird.

Eine Unit Test Datei endet immer mit .spec.ts.
Ein Api Test Datei endet immer mit .api.spec.ts.
Ein Integrationtest endet immer mit .integration.spec.ts.

Beachte, dass das erste describe den Namen der Klasse oder Funktion enthält, die getestet werden soll.
Ein tiefer geschachteltes describe enthält die Methode der Klasse, die getestet werden soll.
Achte darauf, dass die Struktur der Tests für die Methode so aufgebaut ist, dass ein describe-Block jeweils eine Ausgangslage beschreibt, die in einer Funktion const setup darunter definiert wird und in den it-Blöcken danach verwendet wird.
Die setup-Funktion ist immer eine Arrow Function. Die setup-Funktion returned ein Objekt mit allem, was für die Tests benötigt wird.

Ein it-Block sollte niemals ohne einen umgebenden describe-Block existieren, der das Szenario beschreibt. Der describe-Block sollte klar angeben, unter welchen Bedingungen der Testfall ausgeführt wird.

Sämtlicher Code in Tests sollte sich innerhalb des äußeren describe-Blocks befinden, es sei denn, es ist ausnahmsweise nicht anders möglich.

Mocks sind immer Teil der setup-Funktion und nicht im it-Block.

Zwischen Arrange Act Assert im it Block haben wir immer eine Leerzeile.
Zwischen jedem it kommt eine Leerzeile.

Wir verwenden Once bei den mocks. Wird ein mock mehrfach aufgerufen soll mehrfach der Mock mit Once gesetzt werden. Zum Beispiel mockResolveValueOnce anstatt mockResolveValue.

Mocks werden bei uns immer durch das Hinzufügen von afterEach und jest.resetAllMocks(); zurückgesetzt. Dies wird einmalig pro Datei so gesetzt, dass es alle Tests betrifft. Die Rücksetzung erfolgt in einem afterEach-Block, der wie folgt aussieht:

afterEach(() => {
jest.resetAllMocks();
});

Sollten weitere globale Aufräumarbeiten notwendig sein, können diese ebenfalls in diesem afterEach-Block ergänzt werden. beforeEach und afterEach werden ausschließlich für das Zurücksetzen und Aufräumen verwendet; die Vorbereitung der Tests erfolgt in der setup Funktion.

Sollte die Klasse, für die du Tests erstellst, mit einem Decorator von Nest versehen sein (zum Beispiel @Injectable()), dann erstelle nach dem ersten describe einen beforeAll-Block, in dem das TestingModule mit await Test.createTestingModule und compile() initialisiert wird.
Alle im Konstruktor der zu testenden Klasse injizierten Abhängigkeiten sollen vor dem beforeAll als let <name> mit einem golevelup-Mock (createMock) deklariert werden. Im createTestingModule werden diese Abhängigkeiten über das providers-Array mit useValue und dem jeweiligen Mock eingebunden.
Nach dem compile() im beforeAll werden die Instanzen der zu testenden Klasse sowie aller Abhängigkeiten mit module.get(<Name>) zugewiesen.
Falls das TestingModule Ressourcen hält, wird nach allen Tests ein afterAll-Block ergänzt, in dem await module.close() aufgerufen wird, um das Modul sauber zu schließen.
Verwende in Tests immer eine Entity, Domain- oder Value Object Factory, um Entitäten, Domain- oder Value Objects zu erstellen. Ein loses Object wie zb const object = {}; oder der direkte Aufruf des Konstruktor einer Klasse ist nicht erlaubt. Suche im gesamten repo nach den passenden Factories. Die Dateien enden auf "factory.ts". Wenn du eine Factory nicht finden kannst dann Frage bei mir nach. Eine Factory ist immer in einer seperaten Datei und liegt in der Ordnerstruktur auf gleicher Ebene wie das Objekt welches damit erstellt wird. Es ist nicht erlaubt, eine Factory in der Testdatei zu erstellen.

Im Assert Teil des Tests werden immer Werte aus den generierten Testdaten aus der setup Funktion verwendet. Es werden keine hardcodierten Werte verwendet, um die Tests konsistent und wartbar zu halten.

Wenn eine asynchrone Methode oder Funktion gemockt wird, sollte immer mockResolvedValueOnce oder mockRejectedValueOnce verwendet werden, um die asynchrone Natur zu berücksichtigen. Dies stellt sicher, dass der Test korrekt auf die asynchrone Ausführung reagiert. Diese beiden Fälle werden jeweils in einem eigenen describe-Block behandelt.
