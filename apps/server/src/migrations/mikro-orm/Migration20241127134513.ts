import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { ContextExternalToolType } from '@modules/tool/context-external-tool/entity/context-external-tool-type.enum';
import type { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity/context-external-tool.entity';

export class Migration20241127134513 extends Migration {
	async up(): Promise<void> {
		let deleteCount = 0;
		const cursor = this.getCollection<ContextExternalToolEntity>('context-external-tools').find({
			contextType: ContextExternalToolType.COURSE,
		});

		for await (const doc of cursor) {
			const course = await this.getCollection('courses').findOne({ _id: new ObjectId(doc.contextId) });

			if (course === null) {
				await this.getCollection('context-external-tools').deleteOne({ _id: doc._id });
				deleteCount += 1;
			}
		}

		console.info(`Deleted ${deleteCount} context-external-tools without a reference to an existing course context.`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		console.info('This migration cannot be rolled back.');
	}
}
