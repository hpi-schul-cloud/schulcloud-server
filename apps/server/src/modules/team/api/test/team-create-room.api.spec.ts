import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { TeamUserEntity } from '@modules/team/repo';
import { teamFactory, teamUserFactory } from '@modules/team/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

describe('Team Export Room Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'teams');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /:teamId/create-room', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const someId = new ObjectId().toHexString();
				const response = await testApiClient.post(`${someId}/create-room`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user not in the team', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const team = teamFactory.buildWithId();

				await em.persist([school, teacherAccount, teacherUser, team]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, team };
			};

			it('should return a 403 response since the user is not in the team', async () => {
				const { loggedInClient, team } = await setup();

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user not owner in the team', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const teamRole = roleFactory.buildWithId({
					name: RoleName.TEAMADMINISTRATOR,
					permissions: [],
				});
				const team = teamFactory.buildWithId({
					teamUsers: [new TeamUserEntity({ role: teamRole, user: teacherUser, school })],
				});

				await em.persist([school, teacherAccount, teacherUser, team]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, team };
			};

			it('should return a 403 response since the user is only an administrator', async () => {
				const { loggedInClient, team } = await setup();

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is not a teacher', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const teamOwner = roleFactory.buildWithId({
					name: RoleName.TEAMOWNER,
					permissions: [Permission.TEAM_EXPORT_TO_ROOM],
				});
				const team = teamFactory.buildWithId({
					teamUsers: [new TeamUserEntity({ role: teamOwner, user: studentUser, school })],
				});

				await em.persist([school, studentAccount, studentUser, team]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, team };
			};

			it('should return a 403 response since the user is only an administrator', async () => {
				const { loggedInClient, team } = await setup();

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when a teacher is owner of the team', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const teamOwner = roleFactory.buildWithId({
					name: RoleName.TEAMOWNER,
					permissions: [Permission.TEAM_EXPORT_TO_ROOM],
				});
				const team = teamFactory.buildWithId({
					teamUsers: [new TeamUserEntity({ role: teamOwner, user: teacherUser, school })],
				});

				await em.persist([school, teacherAccount, teacherUser, team]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, team };
			};

			it('should return a 201 response with the created room ID', async () => {
				const { loggedInClient, team } = await setup();

				const response = await loggedInClient.post(`${team.id}/create-room`);

				expect(response.status).toBe(HttpStatus.CREATED);
				expect(response.body).toEqual({ roomId: '1234123412341234' });
			});
		});
	});
});
