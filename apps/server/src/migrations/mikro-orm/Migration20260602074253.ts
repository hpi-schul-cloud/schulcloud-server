import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260602074253 extends Migration {
	public async up(): Promise<void> {
		const addLinks = await this.getCollection('helpdocuments').updateOne(
			{ theme: 'n21' },
			{
				$set: {
					theme: 'n21',
					data: [
						{
							title: 'Allgemein',
							content:
								"<a target='_blank' rel='noopener' href='https://s3.hidrive.strato.com/cloud-instances/n21/Willkommensordner/Allgemein/NBC_Broschuere_Erste_Schritte.pdf'>Broschüre: Erste Schritte in der NBC</a><br>",
						},
						{
							title: 'Verwaltung',
							content:
								"<a target='_blank' rel='noopener' href='https://s3.hidrive.strato.com/cloud-instances/n21/Willkommensordner/Verwaltung/Nutzungsordnung-Muster-fuer-die-Schule.docx'>Nutzungsordnung: Muster für die Schule</a><br><a target='_blank' rel='noopener' href='https://s3.hidrive.strato.com/cloud-instances/n21/Willkommensordner/Verwaltung/Datenschutzhinweise-Muster-fuer-die-Schule.docx'>Datenschutzhinweise: Muster für die Schule</a><br>",
						},
					],
				},
			},
			{ upsert: true }
		);

		console.info(`${addLinks.modifiedCount} help document(s) updated.`);
	}

	public async down(): Promise<void> {
		console.info('No need to remove the help document, as it will be overwritten by the next migration.');
		await Promise.resolve();
	}
}
