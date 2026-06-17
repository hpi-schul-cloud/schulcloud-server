import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type orphans = {
	_id: ObjectId;
	orphanedUserId: ObjectId;
};

type orphanCleanupConfigLists = {
	collectionName: string;
	localField: string;
	arrayField: string;
	referenceField: string;
};

export class Migration20260617114638 extends Migration {
	public async up(): Promise<void> {
		const cleanupConfigLists: orphanCleanupConfigLists[] = [
			{ collectionName: 'groups', localField: 'users.user', arrayField: 'users', referenceField: 'user' },
		];

		for (const config of cleanupConfigLists) {
			const users = await this.getCollection(config.collectionName)
				.aggregate<orphans>([
					{ $unwind: `$${config.arrayField}` },
					{
						$lookup: {
							from: 'users',
							localField: config.localField,
							foreignField: '_id',
							as: 'reference_check',
						},
					},
					{
						$match: {
							reference_check: { $size: 0 },
						},
					},
					{
						$project: {
							_id: 1,
							orphanedUserId: `$${config.localField}`,
						},
					},
				])
				.toArray();

			console.log('Examining ${config.collectionName}.${config.localField}');
			console.log(`Found ${users.length} records with orphaned user references`);

			if (users.length === 0) {
				console.log(`No action required.`);
				continue;
			}

			const orphanedUserIds = users.map((entry: { orphanedUserId: ObjectId }) => entry.orphanedUserId);

			const result = await this.getCollection(config.collectionName).updateMany(
				{ [config.localField]: { $in: orphanedUserIds } },
				{
					$pull: {
						[config.arrayField]: {
							[config.referenceField]: { $in: orphanedUserIds },
						},
					},
				} as never
			);

			console.log(`updated ${result.modifiedCount} records`);
		}
	}
}
