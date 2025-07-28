import { Migration } from '@mikro-orm/migrations-mongodb';
import { splitForSearchIndexes } from '../../../../../src/utils/search.js';
import { AnyBulkWriteOperation } from 'mongodb';
import { ObjectId } from 'mongodb';
import process from 'node:process';

export class Migration20250717145035 extends Migration {
	public async up(): Promise<void> {
		console.log(
			'Start migration to remove the old user search indexes and introduce the new allSearchableStrings field.'
		);
		const userCollection = this.getCollection('users');
		if (await userCollection.indexExists('userSearchIndex')) {
			console.log('Found and dropping existing userSearchIndex.');
			await userCollection.dropIndex('userSearchIndex');
		}

		const cursor = userCollection.find();
		const batchSize = 1000;
		let batch: AnyBulkWriteOperation[] = [];
		let processedUsers = 0;

		while (await cursor.hasNext()) {
			const user = await cursor.next();
			if (user) {
				const allSearchableStrings =
					// eslint-disable-next-line no-process-env
					process.env.INCLUDE_MAIL_IN_USER_FULL_TEXT_INDEX !== 'false'
						? splitForSearchIndexes(user.firstName, user.lastName, user.email)
						: splitForSearchIndexes(user.firstName, user.lastName);

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
					processedUsers += batch.length;
					console.log(`Updating a batch of ${batch.length} users. (${processedUsers} users processed so far)`);
					// @ts-expect-error: MikroORM's bulkWrite type is not exported, but this works at runtime
					await userCollection.bulkWrite(batch);
					batch = [];
				}
			}
		}

		if (batch.length > 0) {
			processedUsers += batch.length;
			console.log(`Updating the last batch of ${batch.length} users. (${processedUsers} users processed in total)`);
			// @ts-expect-error: MikroORM's bulkWrite type is not exported, but this works at runtime
			await userCollection.bulkWrite(batch);
		}
		console.log('Finished migration to remove the old user search indexes.');
	}
}
