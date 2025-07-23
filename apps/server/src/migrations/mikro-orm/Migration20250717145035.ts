import { Migration } from '@mikro-orm/migrations-mongodb';
import { splitForSearchIndexes } from '../../../../../src/utils/search.js';
import { AnyBulkWriteOperation } from 'mongodb';
import { ObjectId } from 'mongodb';

export class Migration20250717145035 extends Migration {
	async up(): Promise<void> {
		const userCollection = this.getCollection('users');
		if (await userCollection.indexExists('userSearchIndex')) {
			await userCollection.dropIndex('userSearchIndex');
		}

		const cursor = userCollection.find();
		const batchSize = 1000;
		let batch: AnyBulkWriteOperation[] = [];

		while (await cursor.hasNext()) {
			const user = await cursor.next();
			if (user) {
				const allSearchableStrings = splitForSearchIndexes(user.firstName, user.lastName, user.email);

				batch.push({
					updateOne: {
						filter: { _id: new ObjectId(user._id.toHexString()) },
						update: {
							$set: { allSearchableStrings },
							$unset: {
								emailSearchValues: '',
								firstNameSearchValues: '',
								lastNameSearchValues: '',
							},
						},
					},
				});

				if (batch.length === batchSize) {
					// @ts-ignore
					await userCollection.bulkWrite(batch);
					batch = [];
				}
			}
		}

		if (batch.length > 0) {
			// @ts-ignore
			await userCollection.bulkWrite(batch);
		}
	}
}
