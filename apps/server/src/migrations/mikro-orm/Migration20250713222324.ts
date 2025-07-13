import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250713222324 extends Migration {
	public async up(): Promise<void> {
		const rooms = await this.getCollection('rooms').updateMany(
			{
				features: {
					$exists: false,
				},
			},
			{
				$set: {
					features: [],
				},
			}
		);

		console.info("Added property 'features' in 'rooms' where not present: ", rooms.modifiedCount);
	}

	public async down(): Promise<void> {
		const rooms = await this.getCollection('rooms').updateMany(
			{
				features: {
					$exists: true,
				},
				'features.0': {
					$exists: false,
				},
			},
			{
				$unset: {
					features: '',
				},
			}
		);

		console.info("Removed property 'features' in 'rooms' where present but not set: ", rooms.modifiedCount);
	}
}
