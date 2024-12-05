import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241112163538 extends Migration {
	async up(): Promise<void> {
		const collection = this.getCollection('room-members');

		await collection.updateMany({ roomId: { $type: 'string' } }, [
			{
				$set: {
					roomId: {
						$convert: {
							input: '$roomId',
							to: 'objectId',
							onError: '$roomId', // Keep the original value if conversion fails
							onNull: '$roomId', // Keep the original value if the input is null
						},
					},
				},
			},
		]);
		console.info('Converted roomId from string to ObjectId');

		await collection.updateMany({}, { $rename: { roomId: 'room' } });
		console.info('Renamed roomId to room');
	}

	async down(): Promise<void> {
		await Promise.resolve();
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
