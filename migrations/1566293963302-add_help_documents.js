const mongoose = require('mongoose');

const { connect, close } = require('../src/utils/database');

const HelpDocuments = mongoose.model(
	'helpdocument',
	new mongoose.Schema(
		{
			schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'school' },
			theme: { type: String },
			data: [
				{
					title: { type: String, required: true },
					content: { type: String, required: true },
				},
			],
		},
		{ timestamps: true }
	)
);

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
						title: 'Arbeitsgruppen',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Arbeitsgruppen/Ergebnisse-der-Arbeitsgruppen.pdf'>Ergebnisse der Arbeitsgruppen [.pdf]</a>",
					},
					{
						title: 'Begleitmaterial',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/global/Willkommensordner/Begleitmaterial/Broschuere_HPI-Schul-Cloud-und-Lernen-4.0.pdf'>Broschüre: HPI Schul-Cloud und Lernen 4.0 [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Begleitmaterial/MINT-EC-Leitfaeden-zur-Einfuehrung-in-die-HPI-Schul-Cloud.pdf'>MINT-EC-Leitfäden zur Einführung in die HPI Schul-Cloud [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Datenschutz_Checkliste.pdf'>Datenschutz-Checkliste [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
					},
					{
						title: 'Datenschutz-Merkblätter',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/DS-Merkblaetter/Merkblatt-Email-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Uebersicht-Vorlagen.pdf'>Übersicht der Vorlagen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Checkliste_Struktur-einer-Testphase.pdf'>Checkliste: Struktur einer Testphase [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Elternbrief.pdf'>Elternbrief [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Laptopordnung.pdf'>Laptopordnung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Nutzungsordnung-fuer-Informations-und-Kommunikationstechnik.pdf'>Nutzungsordnung für Informations- und Kommunikationstechnik [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Nuzungsordnung-fuer-mobile-Endgeraete.pdf'>Nuzungsordnung für mobile Endgeräte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/default/Willkommensordner/Vorlagen/Schulleiterbrief.pdf'>Schulleiterbrief [.pdf]</a><br>",
					},
				],
			},
			{
				theme: 'brb',
				data: [
					{
						title: 'Arbeitsgruppen',
						content: 'Folgt demnächst...',
					},
					{
						title: 'Begleitmaterial',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/global/Willkommensordner/Begleitmaterial/Broschuere_HPI-Schul-Cloud-und-Lernen-4.0.pdf'>Broschüre: HPI Schul-Cloud und Lernen 4.0 [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Empfaenger-personenbezogener-Daten.pdf'>Empfänger personenbezogener Daten [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Muster-Freigabeerklaerung.pdf'>Muster Freigabeerklärung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
					},
					{
						title: 'Datenschutz-Merkblätter',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/DS-Merkblaetter/Merkblatt-Email-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/brb/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen',
						content: 'Folgt demnächst...',
					},
				],
			},
			{
				theme: 'open',
				data: [
					{
						title: 'Begleitmaterial',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/global/Willkommensordner/Begleitmaterial/Broschuere_HPI-Schul-Cloud-und-Lernen-4.0.pdf'>Broschüre: HPI Schul-Cloud und Lernen 4.0 [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz',
						content: 'Folgt demnächst...',
					},
					{
						title: 'Datenschutz-Merkblätter',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Email-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen',
						content: 'Folgt demnächst...',
					},
				],
			},
			{
				theme: 'open',
				schoolGroupId: mongoose.Types.ObjectId('5d5fea68f83d16262c31509c'),
				data: [
					{
						title: 'Begleitmaterial',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/global/Willkommensordner/Begleitmaterial/Broschuere_HPI-Schul-Cloud-und-Lernen-4.0.pdf'>Broschüre: HPI Schul-Cloud und Lernen 4.0 [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz',
						content: 'Folgt demnächst...',
					},
					{
						title: 'Datenschutz-Merkblätter',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Email-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen',
						content: 'Folgt demnächst...',
					},
				],
			},
			{
				theme: 'open',
				schoolId: mongoose.Types.ObjectId('5cbf0d9e7883770010ff920d'),
				data: [
					{
						title: 'Begleitmaterial',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/global/Willkommensordner/Begleitmaterial/Broschuere_HPI-Schul-Cloud-und-Lernen-4.0.pdf'>Broschüre: HPI Schul-Cloud und Lernen 4.0 [.pdf]</a><br>",
					},
					{
						title: 'Datenschutz',
						content: 'Folgt demnächst...',
					},
					{
						title: 'Datenschutz-Merkblätter',
						content:
							"<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Email-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/open/Willkommensordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
					},
					{
						title: 'Vorlagen',
						content: 'Folgt demnächst...',
					},
				],
			},
			{
				theme: 'open',
				schoolId: mongoose.Types.ObjectId('5f2987e020834114b8efd6f8'),
				data: [
					{
						title: 'Arbeitsgruppen (Paul-Gerhardt-Gymnasium Test)',
						content: 'Testinhalt',
					},
					{
						title: 'Begleitmaterial (Paul-Gerhardt-Gymnasium Test)',
						content: 'Testinhalt',
					},
					{
						title: 'Datenschutz (Paul-Gerhardt-Gymnasium Test)',
						content: 'Testinhalt',
					},
					{
						title: 'Datenschutz-Merkblätter (Paul-Gerhardt-Gymnasium Test)',
						content: 'Testinhalt',
					},
					{
						title: 'Vorlagen (Paul-Gerhardt-Gymnasium Test)',
						content: 'Testinhalt',
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
