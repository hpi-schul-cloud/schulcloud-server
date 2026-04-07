import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260402130000 extends Migration {
	public async up(): Promise<void> {
		console.log(
			'Renaming boardnodes field "context" to "contextId" to resolve MikroORM embedded property name collision'
		);

		const conflicting = await this.getCollection('boardnodes').countDocuments({
			context: { $exists: true },
			contextId: { $exists: true },
		});

		if (conflicting > 0) {
			console.warn(
				`Skipping ${conflicting} boardnodes documents that already have both "context" and "contextId" — manual review needed`
			);
		}

		const result = await this.getCollection('boardnodes').updateMany(
			{ context: { $exists: true }, contextId: { $exists: false } },
			{ $rename: { context: 'contextId' } }
		);

		console.log(`Updated ${result.modifiedCount} documents in boardnodes`);
	}

	public async down(): Promise<void> {
		console.log('Reverting boardnodes field "contextId" back to "context"');

		const conflicting = await this.getCollection('boardnodes').countDocuments({
			contextId: { $exists: true },
			context: { $exists: true },
		});

		if (conflicting > 0) {
			console.warn(
				`Skipping ${conflicting} boardnodes documents that already have both "contextId" and "context" — manual review needed`
			);
		}

		const result = await this.getCollection('boardnodes').updateMany(
			{ contextId: { $exists: true }, context: { $exists: false } },
			{ $rename: { contextId: 'context' } }
		);

		console.log(`Reverted ${result.modifiedCount} documents in boardnodes`);
	}
}
