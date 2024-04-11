import { Migration } from '@mikro-orm/migrations-mongodb';

/*
 * cleanup old migration records from db
 */
export class Migration20240108111130 extends Migration {
	async up(): Promise<void> {
		const { deletedCount } = await this.getCollection('migrations').deleteMany({}, { session: this.ctx });
		console.log(`removed ${deletedCount} records`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		// do nothing
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
