import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260402130000 extends Migration {
	public async up(): Promise<void> {
		console.log(
			'Renaming boardnodes field "context" to "contextId" to resolve MikroORM embedded property name collision'
		);

		const result = await this.getCollection('boardnodes').updateMany(
			{ context: { $exists: true } },
			{ $rename: { context: 'contextId' } }
		);

		console.log(`Updated ${result.modifiedCount} documents in boardnodes`);
	}

	public async down(): Promise<void> {
		console.log('Reverting boardnodes field "contextId" back to "context"');

		const result = await this.getCollection('boardnodes').updateMany(
			{ contextId: { $exists: true } },
			{ $rename: { contextId: 'context' } }
		);

		console.log(`Reverted ${result.modifiedCount} documents in boardnodes`);
	}
}
