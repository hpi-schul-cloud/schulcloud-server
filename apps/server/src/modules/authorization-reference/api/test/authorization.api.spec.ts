import { EntityManager } from '@mikro-orm/core';
import {
	Action,
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationContextBuilder,
} from '@modules/authorization';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { AuthorizationBodyParams } from '../dto';
import { AuthorizationResponseMapper } from '../mapper';
import { createAccessTokenParamsTestFactory } from '../../testing';
import { title } from 'node:process';

const createExamplePostData = (userId: string): AuthorizationBodyParams => {
	const referenceType = AuthorizableReferenceType.User;
	const context = AuthorizationContextBuilder.read([]);

	const postData: AuthorizationBodyParams = {
		referenceId: userId,
		referenceType,
		context,
	};

	return postData;
};

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

	describe('authorizeByReference', () => {
		describe('When user is not logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const postData = createExamplePostData(teacherUser.id);

				return {
					postData,
				};
			};

			it('should response with unauthorized exception', async () => {
				const { postData } = await setup();

				const response = await testApiClient.post(`by-reference`, postData);

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
				const postData = createExamplePostData(teacherUser.id);

				return {
					loggedInClient,
					postData,
				};
			};

			it('should response with api validation error for invalid reference type', async () => {
				const { loggedInClient, postData } = await setup();
				const invalidReferenceType = 'abc' as AuthorizableReferenceType;
				postData.referenceType = invalidReferenceType;

				const response = await loggedInClient.post(`/by-reference/`, postData);

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
				const { loggedInClient, postData } = await setup();
				const invalidReferenceId = 'abc';
				postData.referenceId = invalidReferenceId;

				const response = await loggedInClient.post(`/by-reference`, postData);

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
				const { loggedInClient, postData } = await setup();
				const invalidActionContext = { requiredPermissions: [] } as unknown as AuthorizationContext;
				postData.context = invalidActionContext;

				const response = await loggedInClient.post(`by-reference`, postData);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['context', 'action'], errors: [expect.any(String)] }],
				});
			});

			it('should response with api validation error for invalid requiredPermissions in body', async () => {
				const { loggedInClient, postData } = await setup();
				const invalidRequiredPermissionContext = { action: Action.read } as unknown as AuthorizationContext;
				postData.context = invalidRequiredPermissionContext;

				const response = await loggedInClient.post(`by-reference`, postData);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [
						{
							field: ['context', 'requiredPermissions'],
							errors: [expect.any(String), 'requiredPermissions must be an array'],
						},
					],
				});
			});

			it('should response with api validation error for wrong permission in requiredPermissions in body', async () => {
				const { loggedInClient, postData } = await setup();
				const invalidPermissionContext = AuthorizationContextBuilder.read([
					Permission.USER_UPDATE,
					'INVALID_PERMISSION' as Permission,
				]);
				postData.context = invalidPermissionContext;

				const response = await loggedInClient.post(`by-reference`, postData);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['context', 'requiredPermissions'], errors: [expect.any(String)] }],
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
				const postData = createExamplePostData(otherUser.id);
				postData.context.requiredPermissions = [Permission.ADMIN_EDIT];
				const expectedResult = AuthorizationResponseMapper.mapToAuthorizedResponse(teacherUser.id, false);

				return {
					loggedInClient,
					expectedResult,
					postData,
				};
			};

			it('should response with unsuccess authorisation response', async () => {
				const { loggedInClient, expectedResult, postData } = await setup();

				const response = await loggedInClient.post(`by-reference`, postData);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual(expectedResult);
			});
		});

		describe('When operation is authorized', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);
				const postData = createExamplePostData(teacherUser.id);
				const expectedResult = AuthorizationResponseMapper.mapToAuthorizedResponse(teacherUser.id, true);

				return {
					loggedInClient,
					expectedResult,
					postData,
				};
			};

			it('should response with success authorisation response', async () => {
				const { loggedInClient, expectedResult, postData } = await setup();

				const response = await loggedInClient.post(`by-reference`, postData);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual(expectedResult);
			});
		});
	});

	describe('createToken', () => {
		describe('When user is not logged in', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const postData = createAccessTokenParamsTestFactory().withReferenceId(teacherUser.id).build();

				return {
					postData,
				};
			};

			it('should response with unauthorized exception', async () => {
				const { postData } = await setup();

				const response = await testApiClient.post('create-token', postData);

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
				const postData = createAccessTokenParamsTestFactory().withReferenceId(teacherUser.id).build();

				return {
					loggedInClient,
					postData,
				};
			};

			it('should response with api validation error for invalid reference type', async () => {
				const { loggedInClient, postData } = await setup();
				const invalidReferenceType = 'abc' as AuthorizableReferenceType;
				postData.referenceType = invalidReferenceType;

				const response = await loggedInClient.post(`/create-token`, postData);

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
				const { loggedInClient, postData } = await setup();
				const invalidReferenceId = 'abc';
				postData.referenceId = invalidReferenceId;

				const response = await loggedInClient.post(`/create-token`, postData);

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
				const { loggedInClient, postData } = await setup();
				const invalidActionContext = { requiredPermissions: [] } as unknown as AuthorizationContext;
				postData.context = invalidActionContext;

				const response = await loggedInClient.post(`create-token`, postData);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [{ field: ['context', 'action'], errors: [expect.any(String)] }],
				});
			});

			it('should response with api validation error for invalid requiredPermissions in body', async () => {
				const { loggedInClient, postData } = await setup();
				const invalidRequiredPermissionContext = { action: Action.read } as unknown as AuthorizationContext;
				postData.context = invalidRequiredPermissionContext;

				const response = await loggedInClient.post(`create-token`, postData);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					type: 'API_VALIDATION_ERROR',
					title: 'API Validation Error',
					message: 'API validation failed, see validationErrors for details',
					code: 400,
					validationErrors: [
						{
							field: ['context', 'requiredPermissions'],
							errors: [expect.any(String), 'requiredPermissions must be an array'],
						},
					],
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
				const postData = createAccessTokenParamsTestFactory().withReferenceId(otherUser.id).withWriteAccess().build();
				postData.context.requiredPermissions = [Permission.ADMIN_EDIT];

				return {
					loggedInClient,
					postData,
				};
			};

			it('should response with forbidden', async () => {
				const { loggedInClient, postData } = await setup();

				const response = await loggedInClient.post('create-token', postData);

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
				const postData = createAccessTokenParamsTestFactory().withReferenceId(teacherUser.id).withWriteAccess().build();

				return {
					loggedInClient,
					postData,
				};
			};

			it('should response with success authorisation response', async () => {
				const { loggedInClient, postData } = await setup();

				const response = await loggedInClient.post('create-token', postData);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual({ token: expect.any(String) });
			});
		});
	});

	// TODO: How to test the line isWitelisted?
	// TODO: How to test if user is not logged in?
	// TODO: TTL
	describe('resolveToken', () => {
		describe('When token exists', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);
				const postData = createAccessTokenParamsTestFactory().withReferenceId(teacherUser.id).withWriteAccess().build();
				const response = await loggedInClient.post('create-token', postData);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const token = response.body.token as string;
				const tokenTtl = 3600;

				return { token, tokenTtl };
			};

			it('should response ok', async () => {
				const { token, tokenTtl } = await setup();

				const response = await testApiClient.get(`resolve-token/${token}/ttl/${tokenTtl.toString()}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					payload: {},
				});
			});
		});
	});
});
