import { EntityManager } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomMemberListResponse } from '../dto/response/room-member-list.response';
import { RoomSetup } from './util/room-setup.helper';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');
	});

	beforeEach(async () => {
		jest.setTimeout(60000);
		await cleanupCollections(em);

		await em.clearCache('roles-cache-byname-roomadmin');
		await em.clearCache('roles-cache-byname-roomowner');
		await em.clearCache('roles-cache-byname-teacher');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /rooms/:roomId/members/pass-ownership', () => {
		const setup = async () => {
			const roomSetup = new RoomSetup(em, testApiClient);
			await roomSetup.setup([
				['SameSchoolTeacher_roomowner', 'sameSchool', 'teacher', 'roomowner'],
				['SameSchoolTeacher_roomadmin', 'sameSchool', 'teacher', 'roomadmin'],
				['SameSchoolStudent_roomviewer', 'sameSchool', 'student', 'roomviewer'],
				['SameSchoolTeacher_none', 'sameSchool', 'teacher', 'none'],
				['OtherSchoolTeacher_roomeditor', 'otherSchool', 'teacher', 'roomeditor'],
			]);
			return roomSetup;
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setup();

				const response = await testApiClient.patch(`/${room.id}/members/pass-ownership`);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has the required permissions', () => {
			it('should change the target user to owner', async () => {
				const roomSetup = await setup();
				const loggedInClient = await roomSetup.loginUser('SameSchoolTeacher_roomowner');
				const targetUser = roomSetup.getUserByName('SameSchoolTeacher_roomadmin');

				await loggedInClient.patch(`/${roomSetup.room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				const updatedRoomMembership = await loggedInClient.get(`/${roomSetup.room.id}/members`);
				const body = updatedRoomMembership.body as RoomMemberListResponse;
				expect(body.data).toEqual(
					expect.arrayContaining([expect.objectContaining({ userId: targetUser.id, roomRoleName: RoleName.ROOMOWNER })])
				);
			});

			it('should change the current roomowner to room admin', async () => {
				const roomSetup = await setup();
				const loggedInClient = await roomSetup.loginUser('SameSchoolTeacher_roomowner');
				const targetUser = roomSetup.getUserByName('SameSchoolTeacher_roomadmin');
				const owner = roomSetup.getUserByName('SameSchoolTeacher_roomowner');

				await loggedInClient.patch(`/${roomSetup.room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				const updatedRoomMembership = await loggedInClient.get(`/${roomSetup.room.id}/members`);
				const body = updatedRoomMembership.body as RoomMemberListResponse;
				expect(body.data).toEqual(
					expect.arrayContaining([expect.objectContaining({ userId: owner.id, roomRoleName: RoleName.ROOMADMIN })])
				);
			});
		});

		describe('when user is roomowner', () => {
			it.each([
				['SameSchoolTeacher_roomadmin', HttpStatus.OK],
				['OtherSchoolTeacher_roomeditor', HttpStatus.OK],
				['SameSchoolStudent_roomviewer', HttpStatus.BAD_REQUEST],
				['SameSchoolTeacher_none', HttpStatus.FORBIDDEN],
			] as [string, HttpStatus][])(
				`when passing ownership to %s should return %d`,
				async (targetUserName, expectedStatus) => {
					const roomSetup = await setup();
					const { room } = roomSetup;

					const loggedInClient = await roomSetup.loginUser('SameSchoolTeacher_roomowner');
					const targetUser = roomSetup.getUserByName(targetUserName);

					const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
						userId: targetUser?.id,
					});

					expect(response.status).toBe(expectedStatus);
				}
			);
		});

		describe('when user is roomadmin', () => {
			it.each([
				['SameSchoolTeacher_roomowner', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_roomadmin', HttpStatus.FORBIDDEN],
				['OtherSchoolTeacher_roomeditor', HttpStatus.FORBIDDEN],
				['SameSchoolStudent_roomviewer', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_none', HttpStatus.FORBIDDEN],
			] as [string, HttpStatus][])(
				`when passing ownership to %s should return %d`,
				async (targetUserName, expectedStatus) => {
					const roomSetup = await setup();
					const { room } = roomSetup;

					const targetUser = roomSetup.getUserByName(targetUserName);
					const loggedInClient = await roomSetup.loginUser('SameSchoolTeacher_roomadmin');

					const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
						userId: targetUser?.id,
					});

					expect(response.status).toBe(expectedStatus);
				}
			);
		});

		describe('when the user is a school admin from same school', () => {
			it.each([
				['SameSchoolTeacher_roomowner', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_roomadmin', HttpStatus.OK],
				['SameSchoolStudent_roomviewer', HttpStatus.BAD_REQUEST],
				['OtherSchoolTeacher_roomeditor', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_none', HttpStatus.FORBIDDEN],
			] as [string, HttpStatus][])(
				`when passing ownership to %s should return %d`,
				async (targetUserName, expectedStatus) => {
					const roomSetup = await setup();
					const { room } = roomSetup;

					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school: roomSetup.sameSchool });
					await em.persistAndFlush([adminAccount, adminUser]);
					em.clear();
					const loggedInClient = await testApiClient.login(adminAccount);

					const targetUser = roomSetup.getUserByName(targetUserName);
					const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
						userId: targetUser?.id,
					});

					expect(response.status).toBe(expectedStatus);
				}
			);

			describe('when no roomowner exists', () => {
				it('should gracefully continue and only upgrade role of target user', async () => {
					const roomSetup = new RoomSetup(em, testApiClient);
					await roomSetup.setup([
						['SameSchoolTeacher_roomadmin', 'sameSchool', 'teacher', 'roomadmin'],
						['SameSchoolTeacher_none', 'sameSchool', 'teacher', 'none'],
					]);

					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school: roomSetup.sameSchool });
					await em.persistAndFlush([adminAccount, adminUser]);
					em.clear();
					const loggedInClient = await testApiClient.login(adminAccount);

					const targetUser = roomSetup.getUserByName('SameSchoolTeacher_roomadmin');
					const response = await loggedInClient.patch(`/${roomSetup.room.id}/members/pass-ownership`, {
						userId: targetUser.id,
					});

					expect(response.status).toBe(HttpStatus.OK);

					const updatedRoomMembership = await loggedInClient.get(`/${roomSetup.room.id}/members-redacted`);
					expect(updatedRoomMembership.status).toBe(HttpStatus.OK);
					const body = updatedRoomMembership.body as RoomMemberListResponse;
					expect(body.data).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ userId: targetUser.id, roomRoleName: RoleName.ROOMOWNER }),
						])
					);
				});
			});
		});

		describe('when the user is a school admin from another school', () => {
			it.each([
				['SameSchoolTeacher_roomowner', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_roomadmin', HttpStatus.FORBIDDEN],
				['SameSchoolStudent_roomviewer', HttpStatus.FORBIDDEN],
				['OtherSchoolTeacher_roomeditor', HttpStatus.OK],
				['SameSchoolTeacher_none', HttpStatus.FORBIDDEN],
			] as [string, HttpStatus][])(
				`when passing ownership to %s should return %d`,
				async (targetUserName, expectedStatus) => {
					const roomSetup = await setup();
					const { room } = roomSetup;

					const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school: roomSetup.otherSchool });
					await em.persistAndFlush([adminAccount, adminUser]);
					em.clear();

					const targetUser = roomSetup.getUserByName(targetUserName);
					const loggedInClient = await testApiClient.login(adminAccount);

					const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
						userId: targetUser?.id,
					});

					expect(response.status).toBe(expectedStatus);
				}
			);
		});

		describe('when the user is a school admin and a room owner', () => {
			const setup = async () => {
				const roomSetup = new RoomSetup(em, testApiClient);
				await roomSetup.setup([
					['SameSchoolTeacherAdmin_roomowner', 'sameSchool', ['teacher', 'administrator'], 'roomowner'],
					['SameSchoolTeacher_roomadmin', 'sameSchool', 'teacher', 'roomadmin'],
					['SameSchoolStudent_roomviewer', 'sameSchool', 'student', 'roomviewer'],
					['SameSchoolTeacher_none', 'sameSchool', 'teacher', 'none'],
					['OtherSchoolTeacher_roomeditor', 'otherSchool', 'teacher', 'roomeditor'],
				]);
				return roomSetup;
			};

			it.each([
				['SameSchoolTeacherAdmin_roomowner', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_roomadmin', HttpStatus.OK],
				['SameSchoolStudent_roomviewer', HttpStatus.BAD_REQUEST],
				['OtherSchoolTeacher_roomeditor', HttpStatus.OK],
				['SameSchoolTeacher_none', HttpStatus.FORBIDDEN],
			] as [string, HttpStatus][])(
				`when passing ownership to %s should return %d`,
				async (targetUserName, expectedStatus) => {
					const roomSetup = await setup();
					const { room } = roomSetup;

					const loggedInClient = await roomSetup.loginUser('SameSchoolTeacherAdmin_roomowner');

					const targetUser = roomSetup.getUserByName(targetUserName);
					const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
						userId: targetUser?.id,
					});

					expect(response.status).toBe(expectedStatus);
				}
			);
		});

		describe('when the user is a school admin and a room viewer', () => {
			const setup = async () => {
				const roomSetup = new RoomSetup(em, testApiClient);
				await roomSetup.setup([
					['SameSchoolTeacher_roomowner', 'sameSchool', 'teacher', 'roomowner'],
					['SameSchoolTeacherAdmin_roomadmin', 'sameSchool', ['teacher', 'administrator'], 'roomadmin'],
					['SameSchoolStudent_roomviewer', 'sameSchool', 'student', 'roomviewer'],
					['SameSchoolTeacher_none', 'sameSchool', 'teacher', 'none'],
					['OtherSchoolTeacher_roomeditor', 'otherSchool', 'teacher', 'roomeditor'],
				]);
				return roomSetup;
			};

			it.each([
				['SameSchoolTeacher_roomowner', HttpStatus.FORBIDDEN],
				['SameSchoolTeacherAdmin_roomadmin', HttpStatus.OK],
				['SameSchoolStudent_roomviewer', HttpStatus.FORBIDDEN],
				['OtherSchoolTeacher_roomeditor', HttpStatus.FORBIDDEN],
				['SameSchoolTeacher_none', HttpStatus.FORBIDDEN],
			] as [string, HttpStatus][])(
				`when passing ownership to %s should return %d`,
				async (targetUserName, expectedStatus) => {
					const roomSetup = await setup();
					const { room } = roomSetup;

					const loggedInClient = await roomSetup.loginUser('SameSchoolTeacherAdmin_roomadmin');

					const targetUser = roomSetup.getUserByName(targetUserName);
					const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
						userId: targetUser?.id,
					});

					expect(response.status).toBe(expectedStatus);
				}
			);
		});
	});
});
