import { Migration } from '@mikro-orm/migrations-mongodb';
import { ExternalTool } from '@modules/tool';

export class Migration20250507141822 extends Migration {
	public async up(): Promise<void> {
		const externalTools = await this.getCollection<ExternalTool>('external-tools').updateMany(
			{ isTemplate: { $exists: false } },
			{ $set: { isTemplate: false } }
		);

		console.info("Added 'isTemplate' field to 'external-tools'", externalTools.modifiedCount);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, require-await
	public async down(): Promise<void> {
		console.info('This migration cannot be rolled back.');
	}
}
