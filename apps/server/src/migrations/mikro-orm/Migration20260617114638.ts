import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';

type orphans = {
	_id: ObjectId;
	orphanedUserId: ObjectId;
};

export class Migration20260617114638 extends Migration {
	public async up(): Promise<void> {
		const config = {
			collectionName: 'groups',
			localField: 'users.user',
			arrayField: 'users',
			referenceField: 'user',
		};

		console.log(`Examining ${config.collectionName}.${config.localField}`);

		const records = await this.getCollection(config.collectionName)
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

		console.log(`Found ${records.length} records with orphaned user references`);

		if (records.length === 0) {
			console.log(`No action required.`);
			return;
		}

		const orphanedUserIds = records.map((entry: { orphanedUserId: ObjectId }) => entry.orphanedUserId);

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
