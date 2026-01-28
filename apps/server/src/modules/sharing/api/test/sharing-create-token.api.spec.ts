import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { ShareTokenParentType } from '../../domainobject/share-token.do';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from '../../sharing.config';
import { ShareTokenResponse } from '../dto';

const baseRouteName = '/sharetoken';

describe(`share token creation (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;
	let config: SharingPublicApiConfig;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);

		apiClient = new TestApiClient(app, baseRouteName);
		config = module.get<SharingPublicApiConfig>(SHARING_PUBLIC_API_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with the feature disabled', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([teacherAccount, teacherUser, course]).flush();
			em.clear();

			config.featureCourseShare = false;

			const loggedInClient = await apiClient.login(teacherAccount);

			return { course, loggedInClient };
		};

		it('should return status 403', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.FORBIDDEN);
		});
	});

	describe('with invalid request data', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([teacherAccount, teacherUser, course]).flush();
			em.clear();

			config.featureCourseShare = true;

			const loggedInClient = await apiClient.login(teacherAccount);

			return { course, loggedInClient };
		};

		it('should return status 400 on empty parent id', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: '',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 404 when parent id is not found', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: new ObjectId().toHexString(),
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.NOT_FOUND);
		});

		it('should return status 400 on invalid parent id', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: 'foobar',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 on invalid parent type', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: 'invalid',
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 when expiresInDays is invalid integer', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: 'foo',
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 when expiresInDays is negative', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: -10,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 when expiresInDays is not an integer', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: 2.5,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});
	});

	describe('with valid course payload', () => {
		describe('with authenticated user', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ teachers: [teacherUser] });

				await em.persist([teacherAccount, teacherUser, course]).flush();
				em.clear();

				config.featureCourseShare = true;

				const loggedInClient = await apiClient.login(teacherAccount);

				return { course, loggedInClient };
			};

			it('should return status 201', async () => {
				const { course, loggedInClient } = await setup();

				const response = await loggedInClient.post(undefined, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(response.status).toEqual(HttpStatus.CREATED);
			});

			it('should return a valid result', async () => {
				const { course, loggedInClient } = await setup();

				const response = await loggedInClient.post(undefined, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});
				const result = response.body as ShareTokenResponse;

				expect(result).toEqual({
					token: expect.any(String),
					payload: {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					},
				});
			});

			describe('when exclusive to school', () => {
				it('should return status 201', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						schoolExclusive: true,
					});

					expect(response.status).toEqual(HttpStatus.CREATED);
				});

				it('should return a valid result', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						schoolExclusive: true,
					});
					const result = response.body as ShareTokenResponse;

					expect(result).toEqual({
						token: expect.any(String),
						payload: {
							parentId: course.id,
							parentType: ShareTokenParentType.Course,
						},
					});
				});
			});

			describe('with expiration duration', () => {
				it('should return status 201', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						expiresInDays: 5,
					});

					expect(response.status).toEqual(HttpStatus.CREATED);
				});

				it('should return a valid result containg the expiration timestamp', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						expiresInDays: 5,
					});
					const result = response.body as ShareTokenResponse;

					expect(result).toEqual({
						token: expect.any(String),
						expiresAt: expect.any(String),
						payload: {
							parentId: course.id,
							parentType: ShareTokenParentType.Course,
						},
					});
				});
			});
		});

		describe('with not authenticated user', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ teachers: [teacherUser] });

				await em.persist([teacherAccount, teacherUser, course]).flush();
				em.clear();

				config.featureCourseShare = true;

				return { course };
			};

			it('should return status 401', async () => {
				const { course } = await setup();

				const response = await apiClient.post(undefined, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('with valid room payload', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const room = roomEntityFactory.build({ schoolId: school.id });
				const group = groupEntityFactory.withTypeRoom().buildWithId({
					organization: school,
					users: [
						{
							user: teacherUser,
							role: roomOwnerRole,
						},
					],
				});
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: group.id,
					schoolId: school.id,
				});

				await em.persist([school, teacherAccount, teacherUser, room, group, roomMembership, roomOwnerRole]).flush();
				em.clear();

				config.featureRoomShare = true;

				const loggedInClient = await apiClient.login(teacherAccount);

				return { room, user: teacherUser, loggedInClient };
			};

			it('should return status 201', async () => {
				const { room, loggedInClient } = await setup();

				const response = await loggedInClient.post(undefined, {
					parentId: room.id,
					parentType: ShareTokenParentType.Room,
				});

				expect(response.status).toEqual(HttpStatus.CREATED);
			});

			describe('when user is not in the school', () => {
				it('should return status 403', async () => {
					const { room, user, loggedInClient } = await setup();
					user.school = schoolEntityFactory.buildWithId(); // different school
					await em.persist(user).flush();
					em.clear();

					const response = await loggedInClient.post(undefined, {
						parentId: room.id,
						parentType: ShareTokenParentType.Room,
						schoolExclusive: true,
					});

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
