import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from 'mongodb';

// TODO: N21-1967 test it on dev
export class Migration20240605065231 extends Migration {
	async up(): Promise<void> {
		const collection = this.getCollection('filerecords');
		const cursor = collection.find({});

		for await (const doc of cursor) {
			const { school } = doc;
			if (school) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const locationStorageId = new ObjectId(school);
				const locationStorage = 'school';

				await collection.updateOne(
					{ _id: doc._id },
					{
						$set: { storageLocationId: locationStorageId, storageLocation: locationStorage },
						$unset: { school: 1 },
					}
				);
			}
		}

		console.info('Filerecords adapted for storage location');
	}
}
