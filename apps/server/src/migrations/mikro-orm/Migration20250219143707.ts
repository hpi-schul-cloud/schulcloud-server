import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type ExternalSourceEmbeddable = {
	externalId: string;
	system: ObjectId;
	lastSyncedAt: Date;
};

type GroupEntity = {
	externalSource?: ExternalSourceEmbeddable;
};

type CourseEntity = {
	groupIds?: ObjectId[];

	syncedWithGroup?: ObjectId;
};

type AggregateReturnType = {
	count: number;

	docs: ObjectId[];
};

export class Migration20250219143707 extends Migration {
	public async up(): Promise<void> {
		const aggregationCursor = this.getCollection<GroupEntity>('groups').aggregate([
			{
				$match: { externalSource: { $exists: true } },
			},
			{
				$group: {
					_id: { externalId: '$externalSource.externalId', system: '$externalSource.system' },
					count: { $sum: 1 },
					docs: { $push: '$_id' },
				},
			},
			{
				$match: {
					count: { $gt: 1 },
				},
			},
		]);

		const documents: AggregateReturnType[] = (await aggregationCursor.toArray()) as AggregateReturnType[];

		console.info('Duplicate groups found: ', documents.length);

		for await (const document of documents) {
			const [keep, ...remove] = document.docs;

			console.info(`Processing group ${keep.toHexString()} - removing: ${remove.toString()}`);

			const syncedWithGroup = await this.getCollection<CourseEntity>('courses').updateMany(
				{
					syncedWithGroup: { $in: remove },
				},
				{
					$set: {
						syncedWithGroup: keep,
					},
				}
			);

			console.info('Updated syncedWithGroup of courses: ', syncedWithGroup.modifiedCount);

			// Replaces all entries of 'remove' from 'groups' with 'keep'
			const groupsInCourse = await this.getCollection<CourseEntity>('courses').countDocuments({
				groupIds: { $in: remove },
			});
			await this.getCollection<CourseEntity>('courses')
				.aggregate([
					{ $match: { groupIds: { $in: remove } } },
					// Replaces unwanted group ids from "remove" with "keep"
					{
						$set: {
							groupIds: {
								$map: {
									input: '$groupIds',
									as: 'groupId',
									in: {
										$cond: {
											if: { $in: ['$$groupId', remove] },
											then: keep,
											else: '$$groupId',
										},
									},
								},
							},
						},
					},
					// Makes entries of groupIds unique
					{
						$set: {
							groupIds: {
								$reduce: {
									input: '$groupIds',
									initialValue: [],
									in: {
										$cond: {
											if: { $in: ['$$this', '$$value'] },
											then: '$$value',
											else: { $concatArrays: ['$$value', ['$$this']] },
										},
									},
								},
							},
						},
					},
					{ $merge: 'courses' },
				])
				.toArray();

			console.info('Updated groups of courses: ', groupsInCourse);

			await this.getCollection<GroupEntity>('groups').deleteMany({ _id: { $in: remove } });

			console.info('Deleted groups: ', remove.length);
		}

		console.info('Creating unique index for groups');

		await this.getCollection<GroupEntity>('groups').createIndex(
			{
				'externalSource.externalId': 1,
				'externalSource.system': 1,
			},
			{
				name: 'groupExternalSourceUniqueIndex',
				unique: true,
				partialFilterExpression: { externalSource: { $exists: true } },
			}
		);

		console.info('Unique index for groups created');
	}

	// eslint-disable-next-line require-await,@typescript-eslint/require-await
	public async down(): Promise<void> {
		console.error('Migration down not implemented. You might need to restore database from backup!');
	}
}
