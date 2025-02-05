import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250204140057 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('courses').updateMany(
			{
				ltiToolIds: { $exists: true },
			},
			{
				$unset: { ltiToolIds: '' },
			}
		);
		await this.getCollection('teams').updateMany(
			{
				ltiToolIds: { $exists: true },
			},
			{
				$unset: { ltiToolIds: '' },
			}
		);

		console.info('Removed references to ltitools from courses and teams');

		await this.getCollection('ltitools').drop();
		await this.getCollection('pseudonyms').drop();

		console.info('Dropped ltitools and pseudonyms tables');
	}

	// eslint-disable-next-line @typescript-eslint/require-await, require-await
	public async down(): Promise<void> {
		console.error('Migration down not implemented. You might need to restore database from backup!');
	}
}
