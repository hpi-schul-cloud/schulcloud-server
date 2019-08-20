const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const HelpDocuments = mongoose.model('helpdocument', new mongoose.Schema({
	schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'school' },
	theme: { type: String },
	data: [{
		title: { type: String, required: true },
		content: { type: String, required: true },
	}],
}, { timestamps: true }));

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not an imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		/* eslint-disable max-len */
		await HelpDocuments.create([
			{
				theme: 'default',
				data: [
					{
						title: 'Allgemeines (Main Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Presse-und-Oeffentlichkeitsarbeit.pdf'>Presse- und Öffentlichkeitsarbeit [.pdf]</a>",
					},
					{
						title: 'Arbeitsgruppen (Main Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Arbeitsgruppen/Ergebnisse-der-Arbeitsgruppen.pdf'>Ergebnisse der Arbeitsgruppen [.pdf]</a>",
					},
					{
						title: 'Begleitmaterial (Main Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/HPI-Schul-Cloud-MOOCs.pdf'>HPI Schul-Cloud MOOCs [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/MINT-EC-Leitfaeden-zur-Einfuehrung-in-die-HPI-Schul-Cloud.pdf'>MINT-EC-Leitfäden zur Einführung in die HPI Schul-Cloud [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz (Main Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Datenschutz_Checkliste.pdf'>Datenschutz-Checkliste [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
					},
					{
						title: 'Datenschutz-Merkblätter (Main Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-E-Mail-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen (Main Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Uebersicht-Vorlagen.pdf'>Übersicht der Vorlagen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Checkliste_Struktur-einer-Testphase.pdf'>Checkliste: Struktur einer Testphase [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Elternbrief.pdf'>Elternbrief [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Laptopordnung.pdf'>Laptopordnung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Nutzungsordnung-fuer-Informations-und-Kommunikationstechnik.pdf'>Nutzungsordnung für Informations- und Kommunikationstechnik [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Nuzungsordnung-fuer-mobile-Endgeraete.pdf'>Nuzungsordnung für mobile Endgeräte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Schulleiterbrief.pdf'>Schulleiterbrief [.pdf]</a><br>",
					},
				],
			},
			{
				theme: 'brb',
				data: [
					{
						title: 'Allgemeines (Brandenburg Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Presse-und-Oeffentlichkeitsarbeit.pdf'>Presse- und Öffentlichkeitsarbeit [.pdf]</a>",
					},
					{
						title: 'Arbeitsgruppen (Brandenburg Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Arbeitsgruppen/Ergebnisse-der-Arbeitsgruppen.pdf'>Ergebnisse der Arbeitsgruppen [.pdf]</a>",
					},
					{
						title: 'Begleitmaterial (Brandenburg Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/HPI-Schul-Cloud-MOOCs.pdf'>HPI Schul-Cloud MOOCs [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/MINT-EC-Leitfaeden-zur-Einfuehrung-in-die-HPI-Schul-Cloud.pdf'>MINT-EC-Leitfäden zur Einführung in die HPI Schul-Cloud [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz (Brandenburg Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Datenschutz_Checkliste.pdf'>Datenschutz-Checkliste [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
					},
					{
						title: 'Datenschutz-Merkblätter (Brandenburg Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-E-Mail-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen (Brandenburg Instanz)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Uebersicht-Vorlagen.pdf'>Übersicht der Vorlagen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Checkliste_Struktur-einer-Testphase.pdf'>Checkliste: Struktur einer Testphase [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Elternbrief.pdf'>Elternbrief [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Laptopordnung.pdf'>Laptopordnung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Nutzungsordnung-fuer-Informations-und-Kommunikationstechnik.pdf'>Nutzungsordnung für Informations- und Kommunikationstechnik [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Nuzungsordnung-fuer-mobile-Endgeraete.pdf'>Nuzungsordnung für mobile Endgeräte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Schulleiterbrief.pdf'>Schulleiterbrief [.pdf]</a><br>",
					},
				],
			},
			{
				theme: 'open',
				data: [
					{
						title: 'Begleitmaterial',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/HPI-Schul-Cloud-MOOCs.pdf'>HPI Schul-Cloud MOOCs [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz (TODO)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Datenschutz_Checkliste.pdf'>Datenschutz-Checkliste [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
					},
					{
						title: 'Datenschutz-Merkblätter',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-E-Mail-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen (TODO)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Uebersicht-Vorlagen.pdf'>Übersicht der Vorlagen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Checkliste_Struktur-einer-Testphase.pdf'>Checkliste: Struktur einer Testphase [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Elternbrief.pdf'>Elternbrief [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Laptopordnung.pdf'>Laptopordnung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Nutzungsordnung-fuer-Informations-und-Kommunikationstechnik.pdf'>Nutzungsordnung für Informations- und Kommunikationstechnik [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Nuzungsordnung-fuer-mobile-Endgeraete.pdf'>Nuzungsordnung für mobile Endgeräte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Vorlagen/Schulleiterbrief.pdf'>Schulleiterbrief [.pdf]</a><br>",
					},
				],
			},
			{
				theme: 'open',
				schoolId: mongoose.Types.ObjectId('0000d186816abba584714c5f'),
				data: [
					{
						title: 'Allgemeines (Paul-Gerhardt-Gymnasium Test)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Presse-und-Oeffentlichkeitsarbeit.pdf'>Presse- und Öffentlichkeitsarbeit [.pdf]</a>",
					},
					{
						title: 'Arbeitsgruppen (Paul-Gerhardt-Gymnasium Test)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Arbeitsgruppen/Ergebnisse-der-Arbeitsgruppen.pdf'>Ergebnisse der Arbeitsgruppen [.pdf]</a>",
					},
					{
						title: 'Begleitmaterial (Paul-Gerhardt-Gymnasium Test)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/HPI-Schul-Cloud-MOOCs.pdf'>HPI Schul-Cloud MOOCs [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Begleitmaterial/MINT-EC-Leitfaeden-zur-Einfuehrung-in-die-HPI-Schul-Cloud.pdf'>MINT-EC-Leitfäden zur Einführung in die HPI Schul-Cloud [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz (Paul-Gerhardt-Gymnasium Test)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Datenschutz_Checkliste.pdf'>Datenschutz-Checkliste [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
					},
					{
						title: 'Datenschutz-Merkblätter (Paul-Gerhardt-Gymnasium Test)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-E-Mail-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen (Paul-Gerhardt-Gymnasium Test)',
						content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Uebersicht-Vorlagen.pdf'>Übersicht der Vorlagen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Checkliste_Struktur-einer-Testphase.pdf'>Checkliste: Struktur einer Testphase [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Elternbrief.pdf'>Elternbrief [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Laptopordnung.pdf'>Laptopordnung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Nutzungsordnung-fuer-Informations-und-Kommunikationstechnik.pdf'>Nutzungsordnung für Informations- und Kommunikationstechnik [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Nuzungsordnung-fuer-mobile-Endgeraete.pdf'>Nuzungsordnung für mobile Endgeräte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommensordner/Vorlagen/Schulleiterbrief.pdf'>Schulleiterbrief [.pdf]</a><br>",
					},
				],
			},
		]);
		/* eslint-enable max-len */
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		await HelpDocuments.deleteMany({}).lean().exec();
		// ////////////////////////////////////////////////////
		await close();
	},
};
