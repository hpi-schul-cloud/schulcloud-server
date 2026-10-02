/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { CourseCopyService } from '@modules/learnroom';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { SagaService } from '@modules/saga';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { FormerMembershipUc } from './former-membership.uc';
import { SchoolMaterialTransferRequestRepo } from '../repo';

describe('FormerMembershipUc', () => {
	let module: TestingModule;
	let uc: FormerMembershipUc;
	let em: DeepMocked<EntityManager>;
	let userService: DeepMocked<UserService>;
	let courseService: DeepMocked<CourseService>;
	let roomService: DeepMocked<RoomService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let sagaService: DeepMocked<SagaService>;
	let transferRequestRepo: DeepMocked<SchoolMaterialTransferRequestRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FormerMembershipUc,
				{ provide: EntityManager, useValue: createMock<EntityManager>() },
				{ provide: UserService, useValue: createMock<UserService>() },
				{ provide: CourseService, useValue: createMock<CourseService>() },
				{ provide: RoomService, useValue: createMock<RoomService>() },
				{ provide: RoomMembershipService, useValue: createMock<RoomMembershipService>() },
				{ provide: CourseCopyService, useValue: createMock<CourseCopyService>() },
				{ provide: SagaService, useValue: createMock<SagaService>() },
				{ provide: SchoolMaterialTransferRequestRepo, useValue: createMock<SchoolMaterialTransferRequestRepo>() },
			],
		}).compile();

		uc = module.get(FormerMembershipUc);
		em = module.get(EntityManager);
		userService = module.get(UserService);
		courseService = module.get(CourseService);
		roomService = module.get(RoomService);
		roomMembershipService = module.get(RoomMembershipService);
		courseCopyService = module.get(CourseCopyService);
		sagaService = module.get(SagaService);
		transferRequestRepo = module.get(SchoolMaterialTransferRequestRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const userId = new ObjectId().toHexString();
	const currentSchoolId = new ObjectId().toHexString();
	const oldSchoolId = new ObjectId().toHexString();

	describe('list', () => {
		it('returns empty array if user has no schoolId', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: undefined });
			userService.findById.mockResolvedValueOnce(user);

			const result = await uc.list(userId);
			expect(result).toEqual([]);
		});

		it('finds former courses and rooms dynamically', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			const course = {
				id: new ObjectId().toHexString(),
				name: 'Mathe 10',
				school: { id: oldSchoolId, name: 'Alte Schule' },
			} as any;
			em.find.mockResolvedValueOnce([course]); // courses

			const groupId = new ObjectId().toHexString();
			const roomId = new ObjectId().toHexString();
			const group = {
				id: groupId,
				organization: { id: oldSchoolId, name: 'Alte Schule' },
			} as any;
			em.find.mockResolvedValueOnce([group]); // room groups

			roomMembershipService.getRoomIdByUserGroupId.mockResolvedValueOnce(roomId);
			roomService.getSingleRoom.mockResolvedValueOnce({
				id: roomId,
				name: 'Fachschaft Mathe',
				schoolId: oldSchoolId,
			} as any);

			const items = await uc.list(userId);

			expect(items).toHaveLength(2);
			expect(items[0]).toMatchObject({
				type: 'course',
				refId: course.id,
				name: 'Mathe 10',
				schoolId: oldSchoolId,
				schoolName: 'Alte Schule',
			});
			expect(items[1]).toMatchObject({
				type: 'room',
				refId: roomId,
				name: 'Fachschaft Mathe',
				schoolId: oldSchoolId,
				schoolName: 'Alte Schule',
			});
		});

		it('ignores rooms that fail to load', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			em.find.mockResolvedValueOnce([]); // courses
			const groupId = new ObjectId().toHexString();
			em.find.mockResolvedValueOnce([{ id: groupId }] as any); // room groups

			roomMembershipService.getRoomIdByUserGroupId.mockResolvedValueOnce('deleted-room-id');
			roomService.getSingleRoom.mockRejectedValueOnce(new NotFoundException());

			const items = await uc.list(userId);
			expect(items).toEqual([]);
		});
	});

	describe('transfer', () => {
		it('throws BadRequestException if user has no schoolId', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: undefined });
			userService.findById.mockResolvedValueOnce(user);

			await expect(uc.transfer(userId, 'course', 'course-123')).rejects.toThrow(BadRequestException);
		});

		it('transfers a course successfully, unlinks teacher, and records audit entry', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			const courseId = new ObjectId().toHexString();
			const newCourseId = new ObjectId().toHexString();
			const course = {
				id: courseId,
				name: 'Biologie 9',
				school: { id: oldSchoolId },
			} as any;
			courseService.findById.mockResolvedValueOnce(course);

			courseCopyService.copyCourse.mockResolvedValueOnce({
				status: CopyStatusEnum.SUCCESS,
				copyEntity: { id: newCourseId } as any,
			} as any);

			em.nativeUpdate.mockResolvedValueOnce(1 as any);
			transferRequestRepo.create.mockResolvedValueOnce({} as any);

			const result = await uc.transfer(userId, 'course', courseId);

			expect(result.success).toBe(true);
			expect(result.type).toBe('course');
			expect(result.refId).toBe(courseId);
			expect(result.newRefId).toBe(newCourseId);
			expect(em.nativeUpdate).toHaveBeenCalledWith(
				CourseEntity,
				{ _id: new ObjectId(courseId) },
				{ $pull: { teacherIds: new ObjectId(userId) } }
			);
			expect(transferRequestRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					requesterUserId: userId,
					requesterSchoolId: currentSchoolId,
					originSchoolId: oldSchoolId,
					type: 'course',
					refId: courseId,
					targetRefId: newCourseId,
					status: 'completed',
				})
			);
		});

		it('throws BadRequestException if courseCopyService fails', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			const courseId = new ObjectId().toHexString();
			const course = {
				id: courseId,
				name: 'Biologie 9',
				school: { id: oldSchoolId },
			} as any;
			courseService.findById.mockResolvedValueOnce(course);

			courseCopyService.copyCourse.mockResolvedValueOnce({
				status: CopyStatusEnum.FAIL,
			} as any);

			await expect(uc.transfer(userId, 'course', courseId)).rejects.toThrow(BadRequestException);
		});

		it('transfers a room successfully via saga, unlinks member, and records audit entry', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			const roomId = new ObjectId().toHexString();
			const newRoomId = new ObjectId().toHexString();
			const room = {
				id: roomId,
				name: 'Lehrerzimmer',
				schoolId: oldSchoolId,
			} as any;
			roomService.getSingleRoom.mockResolvedValueOnce(room);

			sagaService.executeSaga.mockResolvedValueOnce({
				roomCopied: { id: newRoomId, name: 'Lehrerzimmer (Kopie)' },
				boardsCopied: [],
			});

			roomMembershipService.removeMembersFromRoom.mockResolvedValueOnce();
			transferRequestRepo.create.mockResolvedValueOnce({} as any);

			const result = await uc.transfer(userId, 'room', roomId);

			expect(result.success).toBe(true);
			expect(result.type).toBe('room');
			expect(result.refId).toBe(roomId);
			expect(result.newRefId).toBe(newRoomId);
			expect(roomMembershipService.removeMembersFromRoom).toHaveBeenCalledWith(roomId, [userId]);
			expect(transferRequestRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					requesterUserId: userId,
					requesterSchoolId: currentSchoolId,
					originSchoolId: oldSchoolId,
					type: 'room',
					refId: roomId,
					targetRefId: newRoomId,
					status: 'completed',
				})
			);
		});
	});

	describe('transferAll', () => {
		it('transfers all items and aggregates results', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValue(user);

			const course = {
				id: new ObjectId().toHexString(),
				name: 'Physik',
				school: { id: oldSchoolId },
			} as any;
			em.find.mockResolvedValueOnce([course]); // courses
			em.find.mockResolvedValueOnce([]); // rooms

			courseService.findById.mockResolvedValueOnce(course);
			courseCopyService.copyCourse.mockResolvedValueOnce({
				status: CopyStatusEnum.SUCCESS,
				copyEntity: { id: 'new-c-id' } as any,
			} as any);
			em.nativeUpdate.mockResolvedValueOnce(1 as any);
			transferRequestRepo.create.mockResolvedValueOnce({} as any);

			const response = await uc.transferAll(userId);

			expect(response.total).toBe(1);
			expect(response.transferred).toBe(1);
			expect(response.failed).toBe(0);
			expect(response.results).toHaveLength(1);
			expect(response.results[0].success).toBe(true);
		});
	});

	describe('discard', () => {
		it('unlinks course teacher and records audit entry with status discarded', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			const courseId = new ObjectId().toHexString();
			courseService.findById.mockResolvedValueOnce({
				id: courseId,
				name: 'Englisch',
				school: { id: oldSchoolId },
			} as any);
			em.nativeUpdate.mockResolvedValueOnce(1 as any);
			transferRequestRepo.create.mockResolvedValueOnce({} as any);

			await uc.discard(userId, 'course', courseId);

			expect(em.nativeUpdate).toHaveBeenCalledWith(
				CourseEntity,
				{ _id: new ObjectId(courseId) },
				{ $pull: { teacherIds: new ObjectId(userId) } }
			);
			expect(transferRequestRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					requesterUserId: userId,
					originSchoolId: oldSchoolId,
					type: 'course',
					refId: courseId,
					status: 'discarded',
				})
			);
		});

		it('unlinks room member and records audit entry with status discarded', async () => {
			const user = userDoFactory.build({ id: userId, schoolId: currentSchoolId });
			userService.findById.mockResolvedValueOnce(user);

			const roomId = new ObjectId().toHexString();
			roomService.getSingleRoom.mockResolvedValueOnce({
				id: roomId,
				name: 'Klassenraum',
				schoolId: oldSchoolId,
			} as any);
			roomMembershipService.removeMembersFromRoom.mockResolvedValueOnce();
			transferRequestRepo.create.mockResolvedValueOnce({} as any);

			await uc.discard(userId, 'room', roomId);

			expect(roomMembershipService.removeMembersFromRoom).toHaveBeenCalledWith(roomId, [userId]);
			expect(transferRequestRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					requesterUserId: userId,
					originSchoolId: oldSchoolId,
					type: 'room',
					refId: roomId,
					status: 'discarded',
				})
			);
		});
	});
});
