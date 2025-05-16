import { Migration } from '@mikro-orm/migrations-mongodb';
import { ExternalToolEntity } from '../../modules/tool/external-tool/repo';

export class Migration20250516083250 extends Migration {
	public async up(): Promise<void> {
		console.info('Dropping --externalToolMediumUniqueIndex-- index for external tool medium');
		await this.getCollection<ExternalToolEntity>('external-tools').dropIndex('externalToolMediumUniqueIndex');

		await this.getCollection<ExternalToolEntity>('external-tools').createIndex(
			{
				'medium.mediumId': 1,
				'medium.mediaSourceId': 1,
			},
			{
				name: 'externalToolMediumUniqueIndex',
				unique: true,
				partialFilterExpression: { medium: { $exists: true } },
			}
		);

		console.info('Created --externalToolMediumUniqueIndex-- index for external tool medium');
	}

	// eslint-disable-next-line require-await,@typescript-eslint/require-await
	public async down(): Promise<void> {
		console.error('Migration down not implemented. You might need to restore database from backup!');
	}
}
