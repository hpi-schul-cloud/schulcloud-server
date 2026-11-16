import { Migration } from '@mikro-orm/migrations-mongodb';
import type { ObjectId } from '@mikro-orm/mongodb';

const SOURCE_COLLECTION = 'teams';
const TARGET_COLLECTION = 'teams_ids';
const BATCH_SIZE = 1000;

export class Migration20261112160434 extends Migration {
	public async up(): Promise<void> {
		const cursor = this.getCollection(SOURCE_COLLECTION)
			.find({}, { projection: { _id: 1 } })
			.batchSize(BATCH_SIZE);

		let batch: { teamsId: ObjectId }[] = [];
		let insertedCount = 0;

		for await (const team of cursor) {
			batch.push({ teamsId: team._id });

			if (batch.length >= BATCH_SIZE) {
				insertedCount += await this.insertBatch(batch);
				batch = [];
				console.info(`  Inserted ${insertedCount} team ids into '${TARGET_COLLECTION}'`);
			}
		}

		if (batch.length > 0) {
			insertedCount += await this.insertBatch(batch);
		}

		console.info(`Finished: inserted ${insertedCount} team ids into '${TARGET_COLLECTION}'`);
	}

	public async down(): Promise<void> {
		try {
			await this.getCollection(TARGET_COLLECTION).drop();
		} catch (error: unknown) {
			const err = error as { code?: number; codeName?: string };
			if (err?.code !== 26 && err?.codeName !== 'NamespaceNotFound') {
				throw error;
			}
		}

		console.info(`Rollback: dropped collection '${TARGET_COLLECTION}'`);
	}

	private async insertBatch(batch: { teamsId: ObjectId }[]): Promise<number> {
		const result = await this.getCollection(TARGET_COLLECTION).insertMany(batch, { ordered: false });

		return result.insertedCount;
	}
}
