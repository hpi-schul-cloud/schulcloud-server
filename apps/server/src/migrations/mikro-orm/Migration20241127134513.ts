import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

export class Migration20241127134513 extends Migration {
	public async up(): Promise<void> {
		let deleteCount = 0;
		const cursor = this.getCollection<{ contextId: ObjectId; contextType: string }>('context-external-tools').find({
			contextType: 'course',
		});

		for await (const doc of cursor) {
			const course = await this.getCollection('courses').findOne({ _id: doc.contextId });

			if (course === null) {
				await this.getCollection('context-external-tools').deleteOne({ _id: doc._id });
				deleteCount += 1;
			}
		}

		console.info(`Deleted ${deleteCount} context-external-tools without a reference to an existing course context.`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await, require-await
	public async down(): Promise<void> {
		console.info('This migration cannot be rolled back.');
	}
}
