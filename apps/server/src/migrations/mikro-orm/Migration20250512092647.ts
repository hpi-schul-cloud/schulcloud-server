import { Migration } from '@mikro-orm/migrations-mongodb';
type ExternalToolEntity = {
	medium: {
		status: string;
	};
};
export class Migration20250512092647 extends Migration {
	public async up(): Promise<void> {
		const externalTools = await this.getCollection<ExternalToolEntity>('external-tools').updateMany(
			{ medium: { $exists: true } },
			{ $set: { 'medium.status': 'active' } }
		);

		console.info("Added 'status' field to 'external-tools' medium, set to 'active'", externalTools.modifiedCount);
	}

	public async down(): Promise<void> {
		const externalTools = await this.getCollection<ExternalToolEntity>('external-tools').updateMany(
			{ medium: { $exists: true } },
			{ $unset: { 'medium.status': '' } }
		);

		console.info("Rollback of add 'status' field to 'external-tools' medium:", externalTools.modifiedCount);
	}
}
