import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241022205656 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('context-external-tools').updateMany(
			{
				contextId: { $type: 'string' },
			},
			[
				{
					$set: {
						contextId: {
							$toObjectId: '$contextId',
						},
					},
				},
			]
		);
	}

	public async down(): Promise<void> {
		await this.getCollection('context-external-tools').updateMany(
			{
				contextId: { $type: 'objectId' },
			},
			[
				{
					$set: {
						contextId: {
							$toString: '$contextId',
						},
					},
				},
			]
		);
	}
}
