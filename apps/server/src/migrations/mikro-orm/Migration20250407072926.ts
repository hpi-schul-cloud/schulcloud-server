import { Migration } from '@mikro-orm/migrations-mongodb';

type ExternalTool = {
	isPreferred?: boolean;
};

export class Migration20250407072926 extends Migration {
	public async up(): Promise<void> {
		const externalTools = await this.getCollection<ExternalTool>('external-tools').updateMany(
			{ isPreferred: { $exists: false } },
			{ $set: { isPreferred: false } }
		);

		console.info("Added 'isPreferred' field to 'external-tools'", externalTools.modifiedCount);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, require-await
	public async down(): Promise<void> {
		console.info('This migration cannot be rolled back.');
	}
}
