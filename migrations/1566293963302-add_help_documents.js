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
		await HelpDocuments.create({
			theme: 'default',
			data: [
				{
					title: 'Allgemeines',
					content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Presse-und-Oeffentlichkeitsarbeit.pdf'>Presse- und Öffentlichkeitsarbeit [.pdf]</a>",
				},
				{
					title: 'Arbeitsgruppen',
					content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Arbeitsgruppen/Ergebnisse-der-Arbeitsgruppen.pdf'>Ergebnisse der Arbeitsgruppen [.pdf]</a>",
				},
				{
					title: 'Begleitmaterial',
					content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-Fachuebergreifende-Unterrichtsszenarien-und-Methoden.pdf'>Broschüre: Die Schul-Cloud im Unterricht: Fachübergreifende Unterrichtsszenarien und Methoden [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Begleitmaterial/Broschuere_Die-Schul-Cloud-im-Unterricht-und-Schulalltag-Mehrwert-und-Voraussetzungen.pdf'>Broschüre: Die Schul-Cloud im Unterricht und Schulalltag: Mehrwert und Voraussetzungen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Begleitmaterial/HPI-Schul-Cloud-MOOCs.pdf'>HPI Schul-Cloud MOOCs [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Begleitmaterial/MINT-EC-Leitfaeden-zur-Einfuehrung-in-die-HPI-Schul-Cloud.pdf'>MINT-EC-Leitfäden zur Einführung in die HPI Schul-Cloud [.pdf]</a><br>",
				},
				{
					title: 'Datenschutz',
					content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Anlagen-zum-Vertrag.pdf'>Anlagen zum Vertrag [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Datenschutz_Checkliste.pdf'>Datenschutz-Checkliste [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Datenschutzerklaerung-Muster-Schulen.pdf'>Datenschutzerklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Dienstvereinbarung-Schule-zum-HPI.pdf'>Dienstvereinbarung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Einwilligungserklaerung-Muster-Schulen.pdf'>Einwilligungserklärung Muster Schulen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Einwilligungskonzept.pdf'>Einwilligungskonzept [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/Nutzungsordnung-HPI-Schule-Schueler.pdf'>Nutzungsordnung zwischen Schule und Schüler [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Datenschutz/VVT-Muster-Schulen.pdf'>VVT Muster Schulen [.pdf]</a>",
				},
				{
					title: 'Datenschutz-Merkblätter',
					content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/DS-Merkblaetter/Datenschutz-Tipps-fuer-SuS.pdf'>Datenschutz-Tipps für SuS [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/DS-Merkblaetter/Merkblatt-E-Mail-Adressen.pdf'>Merkblatt E-Mail-Adressen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/DS-Merkblaetter/Merkblatt-Urheberrecht.pdf'>Merkblatt Urheberrecht [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/DS-Merkblaetter/Merkblatt-fuer-Lehrkraefte.pdf'>Merkblatt für Lehrkräfte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/DS-Merkblaetter/Merkblatt-zur-Nutzung-schuleigener-Geraete.pdf'>Merkblatt zur Nutzung schuleigener Geräte [.pdf]</a>",
				},
				{
					title: 'Vorlagen',
					content: "<a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Uebersicht-Vorlagen.pdf'>Übersicht der Vorlagen [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Checkliste_Struktur-einer-Testphase.pdf'>Checkliste: Struktur einer Testphase [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Elternbrief.pdf'>Elternbrief [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Laptopordnung.pdf'>Laptopordnung [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Nutzungsordnung-fuer-Informations-und-Kommunikationstechnik.pdf'>Nutzungsordnung für Informations- und Kommunikationstechnik [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Nuzungsordnung-fuer-mobile-Endgeraete.pdf'>Nuzungsordnung für mobile Endgeräte [.pdf]</a><br>  <a target='_blank' rel='noopener' href='https://schul-cloud-hpi.s3.hidrive.strato.com/Willkommenordner/Vorlagen/Schulleiterbrief.pdf'>Schulleiterbrief [.pdf]</a><br>",
				},
			],
		});
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
