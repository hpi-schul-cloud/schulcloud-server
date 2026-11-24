import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { uniq } from 'lodash';
import { RoomArrangement } from '../domain/do/room-arrangement.do';
import { RoomArrangementItem, RoomGroupProps } from '../domain/type';
import { ROOM_ARRANGEMENT_SCHEMA_VERSION, RoomArrangementEntity } from './entity';

interface RoomArrangementDocument {
	_id: ObjectId;
	user: ObjectId;
	schemaVersion?: number | null;
	revision?: number;
	ungroupedRoomIds?: EntityId[];
	groups?: RoomGroupProps[];
	confirmGroupDeletion?: boolean;
	items?: RoomArrangementItem[];
	createdAt?: Date;
	updatedAt?: Date;
}

const MAX_INITIALIZATION_ATTEMPTS = 3;
const DUPLICATE_KEY_ERROR_CODE = 11000;

const isDuplicateKeyError = (error: unknown): boolean =>
	error instanceof Error && 'code' in error && error.code === DUPLICATE_KEY_ERROR_CODE;

const isCurrentSchema = (document: RoomArrangementDocument): boolean =>
	document.schemaVersion === ROOM_ARRANGEMENT_SCHEMA_VERSION;

@Injectable()
export class RoomArrangementRepo {
	constructor(private readonly em: EntityManager) {}

	/**
	 * Returns the arrangement of the user. A missing arrangement is created atomically (upsert on the unique `user`
	 * index), a legacy document is converted atomically. Neither changes the revision of an existing arrangement.
	 */
	public async findOrCreateByUserId(userId: EntityId): Promise<RoomArrangement> {
		for (let attempt = 0; attempt < MAX_INITIALIZATION_ATTEMPTS; attempt += 1) {
			const document = await this.upsertByUserId(userId);

			if (document && isCurrentSchema(document)) {
				return this.mapToDomainObject(document);
			}

			const converted = document ? await this.convertLegacyDocument(document) : null;
			if (converted) {
				return this.mapToDomainObject(converted);
			}
		}

		throw new InternalServerErrorException(`Room arrangement of user '${userId}' could not be initialized`);
	}

	/**
	 * Compare-and-swap: writes the arrangement only if the stored revision still equals the revision of the domain
	 * object, and increments the revision. Returns false (nothing written) if the stored revision differs.
	 */
	public async updateIfRevisionMatches(arrangement: RoomArrangement): Promise<boolean> {
		const collection = this.em.getCollection<RoomArrangementDocument>(RoomArrangementEntity.name);

		const result = await collection.updateOne(
			{
				_id: new ObjectId(arrangement.id),
				user: new ObjectId(arrangement.userId),
				revision: arrangement.revision,
			},
			{
				$set: {
					schemaVersion: ROOM_ARRANGEMENT_SCHEMA_VERSION,
					ungroupedRoomIds: arrangement.ungroupedRoomIds,
					groups: arrangement.groups,
					confirmGroupDeletion: arrangement.confirmGroupDeletion,
					items: arrangement.getAllRoomIds().map((id) => {
						return { id };
					}),
					updatedAt: new Date(),
				},
				$inc: { revision: 1 },
			}
		);

		const updated = result.matchedCount === 1;
		if (updated) {
			arrangement.incrementRevision();
		}

		return updated;
	}

	public async deleteArrangements(userId: EntityId): Promise<EntityId[]> {
		const roomArrangements = await this.em.find(RoomArrangementEntity, { userId });

		this.em.remove(roomArrangements);
		await this.em.flush();

		const deletedIds = roomArrangements.map((arrangement) => arrangement.id);

		return deletedIds;
	}

	private async upsertByUserId(userId: EntityId): Promise<RoomArrangementDocument | null> {
		const collection = this.em.getCollection<RoomArrangementDocument>(RoomArrangementEntity.name);
		const user = new ObjectId(userId);
		const now = new Date();

		try {
			const document = await collection.findOneAndUpdate(
				{ user },
				{
					$setOnInsert: {
						schemaVersion: ROOM_ARRANGEMENT_SCHEMA_VERSION,
						revision: 0,
						ungroupedRoomIds: [],
						groups: [],
						confirmGroupDeletion: true,
						items: [],
						createdAt: now,
						updatedAt: now,
					},
				},
				{ upsert: true, returnDocument: 'after' }
			);

			return document;
		} catch (error) {
			if (!isDuplicateKeyError(error)) {
				throw error;
			}

			const document = await collection.findOne({ user });

			return document;
		}
	}

	private async convertLegacyDocument(document: RoomArrangementDocument): Promise<RoomArrangementDocument | null> {
		const ungroupedRoomIds = uniq((document.items ?? []).map((item) => item.id));

		const collection = this.em.getCollection<RoomArrangementDocument>(RoomArrangementEntity.name);

		const converted = await collection.findOneAndUpdate(
			{
				_id: document._id,
				schemaVersion: { $not: { $eq: ROOM_ARRANGEMENT_SCHEMA_VERSION } },
				items: document.items ?? { $exists: false },
			},
			{
				$set: {
					schemaVersion: ROOM_ARRANGEMENT_SCHEMA_VERSION,
					revision: 0,
					ungroupedRoomIds,
					groups: [],
					confirmGroupDeletion: true,
					items: ungroupedRoomIds.map((id) => {
						return { id };
					}),
				},
			},
			{ returnDocument: 'after' }
		);

		return converted;
	}

	private mapToDomainObject(document: RoomArrangementDocument): RoomArrangement {
		const arrangement = new RoomArrangement({
			id: document._id.toHexString(),
			userId: document.user.toHexString(),
			revision: document.revision ?? 0,
			ungroupedRoomIds: [...(document.ungroupedRoomIds ?? [])],
			groups: (document.groups ?? []).map((group) => {
				return {
					id: group.id,
					name: group.name,
					collapsed: group.collapsed,
					roomIds: [...group.roomIds],
				};
			}),
			confirmGroupDeletion: document.confirmGroupDeletion ?? true,
		});

		return arrangement;
	}
}
