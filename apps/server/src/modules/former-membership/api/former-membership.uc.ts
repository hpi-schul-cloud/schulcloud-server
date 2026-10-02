import { CopyStatusEnum } from '@modules/copy-helper';
import { CourseEntity } from '@modules/course/repo/course.entity';
import { CourseService } from '@modules/course';
import { CourseCopyService } from '@modules/learnroom';
import { GroupEntity, GroupEntityTypes } from '@modules/group/entity';
import { RoomMembershipService } from '@modules/room-membership';
import { RoomService } from '@modules/room';
import { SagaService } from '@modules/saga';
import { UserService } from '@modules/user';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import {
	FormerMembershipListItemResponse,
	TransferAllFormerMembershipsResponse,
	TransferFormerMembershipResponse,
} from './dto';
import { FormerMembershipType, SchoolMaterialTransferRequestEntity, SchoolMaterialTransferRequestRepo } from '../repo';

@Injectable()
export class FormerMembershipUc {
	constructor(
		private readonly em: EntityManager,
		private readonly userService: UserService,
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly courseCopyService: CourseCopyService,
		private readonly sagaService: SagaService,
		private readonly transferRequestRepo: SchoolMaterialTransferRequestRepo
	) {}

	/**
	 * Lists former course and room memberships for the given user dynamically:
	 * - Courses: where user is in teacherIds and course.school != user.schoolId
	 * - Rooms: where user is in room group users and group.organization != user.schoolId
	 */
	public async list(userId: EntityId): Promise<FormerMembershipListItemResponse[]> {
		const user = await this.userService.findById(userId);
		const currentSchoolId = user?.schoolId;

		if (!currentSchoolId) {
			return [];
		}

		const items: FormerMembershipListItemResponse[] = [];

		// 1. Dynamic Courses
		const courses = await this.em.find(
			CourseEntity,
			{
				teachers: userId,
				school: { $ne: currentSchoolId },
			},
			{ populate: ['school'] }
		);

		for (const course of courses) {
			const school = course.school as { id?: string; name?: string } | undefined;
			const courseSchoolId = school?.id ?? '';
			items.push(
				new FormerMembershipListItemResponse({
					type: 'course',
					refId: course.id,
					name: course.name,
					schoolId: courseSchoolId.toString(),
					schoolName: school?.name,
				})
			);
		}

		// 2. Dynamic Rooms
		const roomGroups = await this.em.find(
			GroupEntity,
			{
				type: GroupEntityTypes.ROOM,
				users: { user: new ObjectId(userId) },
				organization: { $ne: currentSchoolId },
			},
			{ populate: ['organization'] }
		);

		for (const group of roomGroups) {
			const roomId = await this.roomMembershipService.getRoomIdByUserGroupId(group.id);
			if (!roomId) continue;

			try {
				const room = await this.roomService.getSingleRoom(roomId);
				items.push(
					new FormerMembershipListItemResponse({
						type: 'room',
						refId: roomId,
						name: room.name,
						schoolId: room.schoolId ?? group.organization?.id ?? '',
						schoolName: group.organization?.name,
					})
				);
			} catch {
				// Room might have been deleted in the meantime
			}
		}

		return items;
	}

	/**
	 * Directly transfers a former course or room membership into the current user's new school:
	 * 1. Deep copies the course or room into the user's current school.
	 * 2. Unlinks the user from the origin school's course or room group.
	 * 3. Records an audit entry in school_material_transfer_requests.
	 */
	public async transfer(
		userId: EntityId,
		type: FormerMembershipType,
		refId: EntityId
	): Promise<TransferFormerMembershipResponse> {
		const user = await this.userService.findById(userId);
		const currentSchoolId = user?.schoolId;

		if (!currentSchoolId) {
			throw new BadRequestException('User is not assigned to a school.');
		}

		let name = '';
		let originSchoolId = '';
		let newRefId: EntityId | undefined;

		if (type === 'course') {
			const course = await this.courseService.findById(refId);
			if (!course) {
				throw new NotFoundException(`Course ${refId} not found.`);
			}
			({ name } = course);
			const school = course.school as { id?: string } | undefined;
			originSchoolId = school?.id ?? '';

			const copyStatus = await this.courseCopyService.copyCourse({
				userId,
				courseId: refId,
			});

			if (copyStatus.status === CopyStatusEnum.FAIL) {
				throw new BadRequestException('Failed to copy course to new school.');
			}

			newRefId = copyStatus.copyEntity?.id;

			// Unlink teacher from origin course
			await this.em.nativeUpdate(
				CourseEntity,
				{ _id: new ObjectId(refId) },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				{ $pull: { teacherIds: new ObjectId(userId) } } as any
			);
		} else {
			let roomId = refId;
			let room = await this.roomService.getSingleRoom(roomId).catch(() => null);
			if (!room) {
				const resolvedRoomId = await this.roomMembershipService.getRoomIdByUserGroupId(refId);
				if (resolvedRoomId) {
					roomId = resolvedRoomId;
					room = await this.roomService.getSingleRoom(roomId).catch(() => null);
				}
			}

			if (!room) {
				throw new NotFoundException(`Room ${refId} not found.`);
			}

			({ name } = room);
			originSchoolId = room.schoolId;

			const sagaResult = await this.sagaService.executeSaga('roomCopy', {
				userId,
				roomId,
			});

			newRefId = sagaResult?.roomCopied?.id;
			if (!newRefId) {
				throw new BadRequestException('Failed to copy room to new school.');
			}

			// Unlink member from origin room
			await this.roomMembershipService.removeMembersFromRoom(roomId, [userId]).catch(() => null);
		}

		// Save audit log
		await this.transferRequestRepo.create(
			new SchoolMaterialTransferRequestEntity({
				requesterUserId: userId,
				requesterSchoolId: currentSchoolId,
				originSchoolId,
				type,
				refId,
				targetRefId: newRefId,
				name,
				status: 'completed',
				transferredAt: new Date(),
			})
		);

		return new TransferFormerMembershipResponse({
			success: true,
			type,
			refId,
			newRefId,
		});
	}

	/**
	 * Bulk transfers all available former course and room memberships into the user's current school.
	 */
	public async transferAll(userId: EntityId): Promise<TransferAllFormerMembershipsResponse> {
		const items = await this.list(userId);
		const results: TransferFormerMembershipResponse[] = [];
		let transferred = 0;
		let failed = 0;

		for (const item of items) {
			try {
				const result = await this.transfer(userId, item.type, item.refId);
				results.push(result);
				transferred++;
			} catch (err: unknown) {
				const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
				results.push(
					new TransferFormerMembershipResponse({
						success: false,
						type: item.type,
						refId: item.refId,
						error: errorMessage,
					})
				);
				failed++;
			}
		}

		return new TransferAllFormerMembershipsResponse({
			total: items.length,
			transferred,
			failed,
			results,
		});
	}

	/**
	 * Discard a former membership: Teacher declines to transfer it.
	 * Cleans up the teacher from the old course/group and creates an audit record.
	 */
	public async discard(userId: EntityId, type: FormerMembershipType, refId: EntityId): Promise<void> {
		const user = await this.userService.findById(userId);
		let name = '';
		let originSchoolId = '';

		if (type === 'course') {
			const course = await this.courseService.findById(refId).catch(() => null);
			if (course) {
				({ name } = course);
				const school = course.school as { id?: string } | undefined;
				originSchoolId = school?.id ?? '';
			}
			await this.em.nativeUpdate(
				CourseEntity,
				{ _id: new ObjectId(refId) },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
				{ $pull: { teacherIds: new ObjectId(userId) } } as any
			);
		} else {
			let roomId = refId;
			let room = await this.roomService.getSingleRoom(roomId).catch(() => null);
			if (!room) {
				const resolved = await this.roomMembershipService.getRoomIdByUserGroupId(refId);
				if (resolved) {
					roomId = resolved;
					room = await this.roomService.getSingleRoom(roomId).catch(() => null);
				}
			}
			if (room) {
				({ name } = room);
				originSchoolId = room.schoolId;
			}
			await this.roomMembershipService.removeMembersFromRoom(roomId, [userId]).catch(() => null);
		}

		await this.transferRequestRepo.create(
			new SchoolMaterialTransferRequestEntity({
				requesterUserId: userId,
				requesterSchoolId: user?.schoolId,
				originSchoolId,
				type,
				refId,
				name,
				status: 'discarded',
				transferredAt: new Date(),
			})
		);
	}
}
