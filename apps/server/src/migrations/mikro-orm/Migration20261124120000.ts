import { Migration } from '@mikro-orm/migrations-mongodb';
import type { ObjectId } from '@mikro-orm/mongodb';

const COLLECTION = 'roomarrangements';
const BACKUP_COLLECTION = 'roomarrangements_duplicates_backup';
const USER_INDEX_NAME = 'user_1';
const SCHEMA_VERSION = 2;
const NAMESPACE_NOT_FOUND_ERROR_CODE = 26;

interface RoomGroupDocument {
	id: string;
	name: string;
	collapsed: boolean;
	roomIds: string[];
}

interface RoomArrangementDocument {
	_id: ObjectId;
	user: ObjectId;
	schemaVersion?: number | null;
	revision?: number;
	ungroupedRoomIds?: string[];
	groups?: RoomGroupDocument[];
	confirmGroupDeletion?: boolean;
	items?: { id: string }[];
	createdAt?: Date;
	updatedAt?: Date;
}

interface IndexDescription {
	name?: string;
	key: Record<string, unknown>;
	unique?: boolean;
}

const isNamespaceNotFoundError = (error: unknown): boolean =>
	error instanceof Error && 'code' in error && error.code === NAMESPACE_NOT_FOUND_ERROR_CODE;

const isGrouped = (document: RoomArrangementDocument): boolean => (document.groups ?? []).length > 0;

const getAllRoomIds = (document: RoomArrangementDocument): string[] => [
	...(document.ungroupedRoomIds ?? []),
	...(document.groups ?? []).flatMap((group) => group.roomIds),
];

const compareNewestFirst = (a: RoomArrangementDocument, b: RoomArrangementDocument): number => {
	const byUpdatedAt = (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
	if (byUpdatedAt !== 0) {
		return byUpdatedAt;
	}

	return b._id.toHexString().localeCompare(a._id.toHexString());
};

/**
 * Personal room groups (SVSDEV-1):
 * 1. converts legacy arrangements (only `items`) into the grouped shape, keeping the order and removing duplicates,
 * 2. merges duplicate arrangements of a user into one (aborts if more than one of them already has groups),
 * 3. replaces the non-unique index on `user` with a unique one.
 * The migration can be rerun. `down()` only makes the index non-unique again and never removes grouped data.
 */
export class Migration20261124120000 extends Migration {
	public async up(): Promise<void> {
		await this.checkDuplicatesCanBeMerged();

		const converted = await this.convertLegacyArrangements();
		console.info(`Converted ${converted} legacy room arrangements.`);

		const merged = await this.mergeDuplicateArrangements();
		console.info(`Merged duplicate room arrangements of ${merged} users.`);

		await this.replaceUserIndex(true);
		console.info(`Ensured unique index '${USER_INDEX_NAME}' on '${COLLECTION}'.`);
	}

	public async down(): Promise<void> {
		await this.replaceUserIndex(false);
		console.info(`Rollback: index '${USER_INDEX_NAME}' on '${COLLECTION}' is not unique anymore. Data is unchanged.`);
	}

	private async findDuplicateUserIds(): Promise<ObjectId[]> {
		const duplicates = await this.getCollection<RoomArrangementDocument>(COLLECTION)
			.aggregate<{ _id: ObjectId }>([
				{ $group: { _id: '$user', count: { $sum: 1 } } },
				{ $match: { count: { $gt: 1 } } },
			])
			.toArray();

		return duplicates.map((duplicate) => duplicate._id);
	}

	private async checkDuplicatesCanBeMerged(): Promise<void> {
		const userIds = await this.findDuplicateUserIds();

		for (const userId of userIds) {
			const groupedCount = await this.getCollection<RoomArrangementDocument>(COLLECTION).countDocuments({
				user: userId,
				'groups.0': { $exists: true },
			});

			if (groupedCount > 1) {
				throw new Error(
					`User '${userId.toHexString()}' has ${groupedCount} room arrangements with groups. Reconcile them manually before rerunning this migration.`
				);
			}
		}
	}

	private async convertLegacyArrangements(): Promise<number> {
		const result = await this.getCollection<RoomArrangementDocument>(COLLECTION).updateMany(
			{ schemaVersion: { $not: { $eq: SCHEMA_VERSION } } },
			[
				{
					$set: {
						ungroupedRoomIds: {
							$reduce: {
								input: { $ifNull: ['$items.id', []] },
								initialValue: [],
								in: {
									$cond: [{ $in: ['$$this', '$$value'] }, '$$value', { $concatArrays: ['$$value', ['$$this']] }],
								},
							},
						},
						groups: { $literal: [] },
						confirmGroupDeletion: true,
						revision: 0,
						schemaVersion: SCHEMA_VERSION,
					},
				},
				{
					$set: {
						items: { $map: { input: '$ungroupedRoomIds', in: { id: '$$this' } } },
					},
				},
			]
		);

		return result.modifiedCount;
	}

	private async mergeDuplicateArrangements(): Promise<number> {
		const collection = this.getCollection<RoomArrangementDocument>(COLLECTION);
		const userIds = await this.findDuplicateUserIds();

		for (const userId of userIds) {
			const documents = (await collection.find({ user: userId }).toArray()).sort(compareNewestFirst);
			const kept = documents.find(isGrouped) ?? documents[0];
			const others = documents.filter((document) => document !== kept);

			const knownRoomIds = new Set(getAllRoomIds(kept));
			const missingRoomIds: string[] = [];
			others.flatMap(getAllRoomIds).forEach((roomId) => {
				if (!knownRoomIds.has(roomId)) {
					knownRoomIds.add(roomId);
					missingRoomIds.push(roomId);
				}
			});

			if (missingRoomIds.length > 0) {
				const ungroupedRoomIds = [...(kept.ungroupedRoomIds ?? []), ...missingRoomIds];
				const keptWithMissingRooms = { ...kept, ungroupedRoomIds };
				await collection.updateOne(
					{ _id: kept._id },
					{
						$set: {
							ungroupedRoomIds,
							items: getAllRoomIds(keptWithMissingRooms).map((id) => {
								return { id };
							}),
						},
						$inc: { revision: 1 },
					}
				);
			}

			for (const other of others) {
				await this.getCollection<RoomArrangementDocument>(BACKUP_COLLECTION).replaceOne({ _id: other._id }, other, {
					upsert: true,
				});
			}
			await collection.deleteMany({ _id: { $in: others.map((other) => other._id) } });
		}

		return userIds.length;
	}

	private async replaceUserIndex(unique: boolean): Promise<void> {
		const collection = this.getCollection<RoomArrangementDocument>(COLLECTION);
		const indexes = await this.listIndexes();
		const userIndexes = indexes.filter((index) => Object.keys(index.key).length === 1 && index.key.user === 1);

		if (userIndexes.length === 1 && (userIndexes[0].unique ?? false) === unique) {
			return;
		}

		for (const index of userIndexes) {
			if (index.name) {
				await collection.dropIndex(index.name);
			}
		}

		await collection.createIndex({ user: 1 }, { name: USER_INDEX_NAME, unique });
	}

	private async listIndexes(): Promise<IndexDescription[]> {
		try {
			const indexes = await this.getCollection<RoomArrangementDocument>(COLLECTION).indexes();

			return indexes.map((index) => {
				return { name: index.name, key: index.key, unique: index.unique };
			});
		} catch (error) {
			if (isNamespaceNotFoundError(error)) {
				return [];
			}

			throw error;
		}
	}
}
