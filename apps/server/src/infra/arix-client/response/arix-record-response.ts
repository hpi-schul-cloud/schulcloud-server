import { ArixRecordEntry } from './arix-record-entry';

export interface ArixRecordResponse {
	f: ArixRecordEntry;
	error?: string;
}

/**
 * import { ArixAdressat } from '../type/arix-adressat';
 * import { ArixGeb } from '../type/arix-geb';
 * import { ArixTyp } from '../type/arix-typ';
 *
 * export interface ArixRecordResponse {
 *  // Nummer
 *  nr: number;
 *
 *  // Eindeutiger Identifier
 *  identifier: string;
 *
 *  // Antarsid
 *  antarsid: number;
 *
 *  // Einzigartige Nummer
 *  uniqint: number;
 *
 *  // Parallelnummern
 *  paranr: string[];
 *
 *  // Produktionsland
 *  prodland: string;
 *
 *  // Produzent
 *  produ: string;
 *
 *  // Produktionsjahr
 *  prodjahr: number;
 *
 *  // Adressat
 *  adressat: ArixAdressat;
 *
 *  // Freiwillige Selbstkontrolle
 *  fsk: string;
 *
 *  // öffentliches Vorführrecht vorhanden
 *  vorfrecht: boolean;
 *
 *  // öffentliches Vorführrecht bis
 *  vorfbis: Date | null;
 *
 *  // Sprache
 *  sprache: string;
 *
 *  // Titel
 *  titel: string;
 *
 *  // Untertitel
 *  utitel: string;
 *
 *  // Sortierter Titel
 *  sorttitel: string;
 *
 *  // Sachgebiete
 *  geb: ArixGeb[];
 *
 *  // Schlagworte
 *  schlag: string[];
 *
 *  // Beschreibung
 *  text: string;
 *
 *  // Typ (Medienart)
 *  typ: ArixTyp;
 *
 *  // Länge
 *  laenge: string;
 *
 *  // Kontextmedien
 *  kontextmedien: string;
 *
 *  // Verfügbarkeitsanfang
 *  verfanf: Date | null;
 *
 *  // Verfügbarkeitsende
 *  verfende: Date | null;
 *
 *  // Empfangsdatum
 *  empfende: Date | null;
 *
 *  // Fremdvertrieb
 *  fremdvertrieb: string;
 *
 *  // Erschließer
 *  erschliesser: number;
 *
 *  // Erschließungsstatus
 *  erschlstatus: number;
 *
 *  // Änderungsdatum
 *  aenderung: Date;
 *
 *  // Zuständigkeit
 *  zustaendigkeit: string;
 *
 *  // Sprachfassungen
 *  sprachfassungen: string[];
 *
 *  // Kontext
 *  context: string;
 *
 *  // Suchadressat
 *  searchadressat: string[];
 *
 *  // Erfassungsdatum des Datensatzes
 *  datum: Date;
 *
 *  // Im Altarchiv
 *  altarchiv: boolean;
 *
 *  // Gebühr
 *  gebuehr: number;
 *
 *  // Sperrung
 *  sperrung: boolean;
 *
 *  // Dezentralnummern
 *  dezentralnr: string[];
 *
 *  // Icon-Context
 *  icontext: number;
 *
 *  // Lizenzinformation
 *  lizinfo: string;
 *
 *  // Lizenzdatum
 *  licence: Date;
 * }
 */
