import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/domain/entity/account.entity';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { systemEntityFactory } from '@modules/system/testing';
import type { User } from '@modules/user/repo';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Request } from 'express';
import { MeResponse } from '../dto';

const mapToMeResponseObject = (user: User, account: AccountEntity, permissions: string[]): MeResponse => {
	const roles = user.getRoles();
	const role = roles[0];
	const { school } = user;

	const meResponseObject: MeResponse = {
		school: {
			id: school.id,
			name: school.name,
			logo: {},
		},
		user: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
		},
		roles: [
			{
				id: role.id,
				name: role.name,
			},
		],
		permissions,
		account: {
			id: account.id,
		},
	};

	return meResponseObject;
};

describe('Me Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	describe('me', () => {
		describe('when user is logged in with SVS', () => {
			beforeAll(async () => {
				const moduleFixture = await Test.createTestingModule({
					imports: [ServerTestModule],
				}).compile();

				app = moduleFixture.createNestApplication();
				await app.init();
				em = app.get(EntityManager);
				testApiClient = new TestApiClient(app, 'me');
			});

			afterAll(async () => {
				await app.close();
			});

			describe('when no jwt is passed', () => {
				it('should respond with unauthorized exception', async () => {
					const response = await testApiClient.get();

					expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
					expect(response.body).toEqual({
						type: 'UNAUTHORIZED',
						title: 'Unauthorized',
						message: 'Unauthorized',
						code: 401,
					});
				});
			});

			describe('when valid jwt is passed', () => {
				describe('when user is a student', () => {
					const setup = async () => {
						// The LERNSTORE_VIEW permission on the school is set here as an example. See the unit tests for all variations.
						const school = schoolEntityFactory.build({ permissions: { student: { LERNSTORE_VIEW: true } } });
						const { studentAccount: account, studentUser: user } = UserAndAccountTestFactory.buildStudent({ school });

						await em.persistAndFlush([account, user]);
						em.clear();

						const loggedInClient = await testApiClient.login(account);
						const expectedPermissions = user.resolvePermissions();
						const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

						return { loggedInClient, expectedResponse };
					};

					it('should respond with "me" information and status code 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});
				});

				describe('when user is a teacher', () => {
					const setup = async () => {
						const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();

						await em.persistAndFlush([account, user]);
						em.clear();

						const loggedInClient = await testApiClient.login(account);
						const expectedPermissions = user.resolvePermissions();
						const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

						return { loggedInClient, expectedResponse };
					};

					it('should respond with "me" information and status code 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});
				});

				describe('when user is an admin', () => {
					const setup = async () => {
						const { adminAccount: account, adminUser: user } = UserAndAccountTestFactory.buildAdmin();

						await em.persistAndFlush([account, user]);
						em.clear();

						const loggedInClient = await testApiClient.login(account);
						const expectedPermissions = user.resolvePermissions();
						const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

						return { loggedInClient, expectedResponse };
					};

					it('should respond with "me" information and status code 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});
				});
			});
		});

		describe('when user is logged in with external system', () => {
			let currentUser: ICurrentUser;

			beforeAll(async () => {
				const moduleFixture = await Test.createTestingModule({
					imports: [ServerTestModule],
				})
					.overrideGuard(JwtAuthGuard)
					.useValue({
						canActivate(context: ExecutionContext) {
							const req: Request = context.switchToHttp().getRequest();
							req.user = currentUser;
							return true;
						},
					})
					.compile();

				app = moduleFixture.createNestApplication();
				await app.init();
				em = app.get(EntityManager);
				testApiClient = new TestApiClient(app, 'me');
			});

			afterAll(async () => {
				await app.close();
			});

			describe('when a jwt is passed', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

					const system = systemEntityFactory.build();

					await em.persistAndFlush([studentAccount, studentUser, system]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);
					const expectedPermissions = studentUser.resolvePermissions();

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						schoolId: studentUser.school.id,
						systemId: system.id,
						isExternalUser: true,
					});

					const expectedResponse = mapToMeResponseObject(studentUser, studentAccount, expectedPermissions);
					expectedResponse.systemId = system.id;

					return { loggedInClient, expectedResponse };
				};

				it('should return a "me" response with the corresponding system info with status 200', async () => {
					const { loggedInClient, expectedResponse } = await setup();

					const response = await loggedInClient.get();

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual(expectedResponse);
				});
			});
		});
	});
});
