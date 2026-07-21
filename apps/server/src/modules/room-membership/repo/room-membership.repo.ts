import { Utils } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { RoleName } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { Pagination } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoomMembership } from '../do/room-membership.do';
import { RoomStatsAggregated, RoomStatsAggregatedResult } from '../type/room-stats-aggregated.type';
import { RoomMembershipEntity } from './entity';
import { RoomMembershipDomainMapper } from './room-membership-domain.mapper';

@Injectable()
export class RoomMembershipRepo {
	constructor(private readonly em: EntityManager) {}

	public async findByRoomId(roomId: EntityId): Promise<RoomMembership | null> {
		const roomMembershipEntities = await this.em.findOne(RoomMembershipEntity, { roomId });
		if (!roomMembershipEntities) return null;

		const roomMemberships = RoomMembershipDomainMapper.mapEntityToDo(roomMembershipEntities);

		return roomMemberships;
	}

	public async findByRoomIds(roomIds: EntityId[]): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { roomId: { $in: roomIds } });
		const roomMemberships = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMemberships;
	}

	public async findByGroupId(groupId: EntityId): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { userGroupId: groupId });
		const roomMemberships = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMemberships;
	}

	public async findByGroupIds(groupIds: EntityId[]): Promise<RoomMembership[]> {
		const entities = await this.em.find(RoomMembershipEntity, { userGroupId: { $in: groupIds } });
		const roomMemberships = entities.map((entity) => RoomMembershipDomainMapper.mapEntityToDo(entity));

		return roomMemberships;
	}

	public async save(roomMembership: RoomMembership | RoomMembership[]): Promise<void> {
		const roomMemberships = Utils.asArray(roomMembership);

		roomMemberships.forEach((member) => {
			const entity = RoomMembershipDomainMapper.mapDoToEntity(member);
			this.em.persist(entity);
		});

		await this.em.flush();
	}

	public async delete(roomMembership: RoomMembership | RoomMembership[]): Promise<void> {
		const roomMemberships = Utils.asArray(roomMembership);

		roomMemberships.forEach((member) => {
			const entity = RoomMembershipDomainMapper.mapDoToEntity(member);
			this.em.remove(entity);
		});

		await this.em.flush();
	}

	public async findRoomStatsAggregated(schoolId: EntityId, pagination?: Pagination): Promise<Page<RoomStatsAggregated>> {
		const skip = pagination?.skip ?? 0;
		const limit = pagination?.limit ?? 500;

		const pipeline = [
			// Lookup the group for this room membership
			{
				$lookup: {
					from: 'groups',
					localField: 'userGroup',
					foreignField: '_id',
					as: 'group',
				},
			},

			// Unwind group
			{ $unwind: { path: '$group', preserveNullAndEmptyArrays: false } },

			// Filter groups by type ROOM
			{ $match: { 'group.type': GroupEntityTypes.ROOM } },

			// Lookup users to filter groups that belong to the school
			{
				$lookup: {
					from: 'users',
					localField: 'group.users.user',
					foreignField: '_id',
					as: 'groupUsers',
				},
			},

			// Filter groups where any user belongs to the school OR organization is the school
			{
				$match: {
					$or: [{ 'groupUsers.schoolId': new ObjectId(schoolId) }, { 'group.organization': new ObjectId(schoolId) }],
				},
			},

			// Lookup rooms to get room details
			{
				$lookup: {
					from: 'rooms',
					localField: 'room',
					foreignField: '_id',
					as: 'roomData',
				},
			},

			// Unwind room
			{ $unwind: { path: '$roomData', preserveNullAndEmptyArrays: false } },

			// Lookup schools to get school name
			{
				$lookup: {
					from: 'schools',
					localField: 'roomData.school',
					foreignField: '_id',
					as: 'schoolData',
				},
			},

			// Unwind school
			{ $unwind: { path: '$schoolData', preserveNullAndEmptyArrays: true } },

			// Lookup roles to find the ROOMOWNER role
			{
				$lookup: {
					from: 'roles',
					pipeline: [{ $match: { name: RoleName.ROOMOWNER } }],
					as: 'ownerRole',
				},
			},

			// Unwind owner role
			{ $unwind: { path: '$ownerRole', preserveNullAndEmptyArrays: true } },

			// Add computed fields for member stats and owner
			{
				$addFields: {
					// Find owner user from the group users
					ownerGroupUser: {
						$arrayElemAt: [
							{
								$filter: {
									input: '$group.users',
									as: 'u',
									cond: { $eq: ['$$u.role', '$ownerRole._id'] },
								},
							},
							0,
						],
					},
					// Calculate total members
					totalMembers: { $size: '$group.users' },
					// Calculate internal members (users from the same school)
					internalMembers: {
						$size: {
							$filter: {
								input: '$groupUsers',
								as: 'gu',
								cond: { $eq: ['$$gu.schoolId', new ObjectId(schoolId)] },
							},
						},
					},
				},
			},

			// Lookup owner user details
			{
				$lookup: {
					from: 'users',
					localField: 'ownerGroupUser.user',
					foreignField: '_id',
					as: 'ownerUser',
				},
			},

			// Unwind owner user
			{ $unwind: { path: '$ownerUser', preserveNullAndEmptyArrays: true } },

			// Calculate external members and project final shape
			{
				$addFields: {
					externalMembers: { $subtract: ['$totalMembers', '$internalMembers'] },
				},
			},

			// Project the final result shape
			{
				$project: {
					_id: 0,
					roomId: { $toString: '$room' },
					roomName: '$roomData.name',
					roomSchoolId: { $toString: '$roomData.school' },
					schoolName: { $ifNull: ['$schoolData.name', ''] },
					ownerFirstName: { $ifNull: ['$ownerUser.firstName', ''] },
					ownerLastName: { $ifNull: ['$ownerUser.lastName', ''] },
					totalMembers: 1,
					internalMembers: 1,
					externalMembers: 1,
					createdAt: '$roomData.createdAt',
					updatedAt: '$roomData.updatedAt',
				},
			},

			// Use facet for pagination
			{
				$facet: {
					total: [{ $count: 'count' }],
					data: [{ $skip: skip }, { $limit: limit }],
				},
			},
		];

		type AggregateResult = [{ total: [{ count: number }]; data: RoomStatsAggregatedResult[] }];
		const result = (await this.em.aggregate(RoomMembershipEntity, pipeline)) as AggregateResult;

		const total = result[0]?.total[0]?.count ?? 0;
		const data: RoomStatsAggregated[] = result[0].data.map((item) => ({
			roomId: item.roomId,
			roomName: item.roomName,
			roomSchoolId: item.roomSchoolId,
			schoolName: item.schoolName,
			owner: [item.ownerFirstName, item.ownerLastName].filter(Boolean).join(' ') || undefined,
			totalMembers: item.totalMembers,
			internalMembers: item.internalMembers,
			externalMembers: item.externalMembers,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		}));

		return new Page<RoomStatsAggregated>(data, total);
	}
}
