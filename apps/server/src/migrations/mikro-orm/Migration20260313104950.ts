import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260313104950 extends Migration {
	async up(): Promise<void> {
		const results = await this.getCollection('boardnodes').deleteMany({
			type: { $in: ['submission-container-element', 'submission-item'] },
		});

		console.log(`Removed ${results.deletedCount} submissions container and submission items from boardnodes`);
	}
}
