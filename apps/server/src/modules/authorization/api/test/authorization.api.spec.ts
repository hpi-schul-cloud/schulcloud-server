import { EntityManager } from '@mikro-orm/core';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { Permission } from '@shared/domain/interface';
import { Action, AuthorizableReferenceType, AuthorizationContext, AuthorizationContextBuilder } from '../../domain';
import { AuthorizationReponseMapper } from '../mapper';

describe('Authorization Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'authorization');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('authorize', () => {
		describe('When user is not logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				return {
					referenceId: teacherUser.id,
					referenceType: AuthorizableReferenceType.User,
				};
			};

			it('should response with unauthorized exception', async () => {
				const { referenceId, referenceType } = await setup();

				const response = await testApiClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${referenceId}`
				);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('When invalid data passed', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					referenceId: teacherUser.id,
					referenceType: AuthorizableReferenceType.User,
					context: AuthorizationContextBuilder.read([]),
				};
			};

			it('should response with api validation error for invalid reference type', async () => {
				const { loggedInClient, referenceId, context } = await setup();
				const invalidReferenceType = 'abc' as AuthorizableReferenceType;

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${invalidReferenceType}/referenceId/${referenceId}`,
					context
				);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['referenceType'], errors: [expect.any(String)] }],
				});
			});

			it('should response with api validation error for invalid reference id', async () => {
				const { loggedInClient, referenceType, context } = await setup();
				const invalidReferenceId = 'abc';

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${invalidReferenceId}`,
					context
				);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['referenceId'], errors: [expect.any(String)] }],
				});
			});

			it('should response with api validation error for invalid action in body', async () => {
				const { loggedInClient, referenceType, referenceId } = await setup();
				const invalidActionContext = { requiredPermissions: [] } as unknown as AuthorizationContext;

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${referenceId}`,
					invalidActionContext
				);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['action'], errors: [expect.any(String)] }],
				});
			});

			it('should response with api validation error for invalid requiredPermissions in body', async () => {
				const { loggedInClient, referenceType, referenceId } = await setup();
				const invalidRequiredPermissionContext = { action: Action.read } as unknown as AuthorizationContext;

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${referenceId}`,
					invalidRequiredPermissionContext
				);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [
						{ field: ['requiredPermissions'], errors: [expect.any(String), 'requiredPermissions must be an array'] },
					],
				});
			});

			it('should response with api validation error for wrong permission in requiredPermissions in body', async () => {
				const { loggedInClient, referenceType, referenceId } = await setup();
				const invalidPermissionContext = AuthorizationContextBuilder.read([
					Permission.USER_UPDATE,
					'INVALID_PERMISSION' as Permission,
				]);

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${referenceId}`,
					invalidPermissionContext
				);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['requiredPermissions'], errors: [expect.any(String)] }],
				});
			});
		});

		describe('When operation is not authorized', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { teacherUser: otherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser, otherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					referenceId: otherUser.id,
					referenceType: AuthorizableReferenceType.User,
					context: AuthorizationContextBuilder.write([Permission.ADMIN_EDIT]),
				};
			};

			it('should response with forbidden exception', async () => {
				// unauthorized expection?
				const { loggedInClient, referenceType, referenceId, context } = await setup();

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${referenceId}`,
					context
				);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: 403,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});

		describe('When operation is authorized', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				const referenceId = teacherUser.id;
				const referenceType = AuthorizableReferenceType.User;
				const context = AuthorizationContextBuilder.write([]);
				const expectedResult = AuthorizationReponseMapper.mapToSuccessResponse(
					referenceId,
					referenceType,
					referenceId,
					context
				);

				return {
					loggedInClient,
					referenceId,
					referenceType,
					context,
					expectedResult,
				};
			};

			it('should response with success authorisation response', async () => {
				const { loggedInClient, referenceType, referenceId, context, expectedResult } = await setup();

				const response = await loggedInClient.post(
					`/authorize-by-reference/referenceType/${referenceType}/referenceId/${referenceId}`,
					context
				);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual(expectedResult);
			});
		});
	});
});
