import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContextExternalTool,
	ContextExternalToolType,
	Course,
	ExternalTool,
	Permission,
	School,
	SchoolExternalTool,
} from '@shared/domain';
import {
	cleanupCollections,
	contextExternalToolFactory,
	courseFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	schoolFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import { Response } from 'supertest';
import { Loaded } from '@mikro-orm/core';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	ToolConfigType,
	ToolContextType,
} from '../../interface';
import {
	ContextExternalToolContextParams,
	ExternalToolCreateParams,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ToolConfigurationStatusResponse,
} from '../dto';
import { ToolReferenceListResponse } from '../dto/response/tool-reference-list.response';

describe('ToolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'tools');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[POST] tools', () => {
		const postParams: ExternalToolCreateParams = {
			name: 'Tool 1',
			parameters: [
				{
					name: 'key',
					description: 'This is a parameter.',
					displayName: 'User Friendly Name',
					defaultValue: 'abc',
					isOptional: false,
					type: CustomParameterTypeParams.STRING,
					regex: 'abc',
					regexComment: 'Regex accepts "abc" as value.',
					location: CustomParameterLocationParams.PATH,
					scope: CustomParameterScopeTypeParams.GLOBAL,
				},
			],
			config: {
				type: ToolConfigType.BASIC,
				baseUrl: 'https://link.to-my-tool.com/:key',
			},
			isHidden: false,
			logoUrl: 'https://link.to-my-logo.com',
			url: 'https://link.to-my-tool.com',
			openNewTab: true,
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const params: ExternalToolCreateParams = { ...postParams };

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params };
			};

			it('should create a tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post(undefined, params).expect(HttpStatus.CREATED);

				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				const loaded: Loaded<ExternalTool> = await em.findOneOrFail(ExternalTool, { id: body.id });

				expect(loaded).toBeDefined();
			});

			it('should return the created tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post(undefined, params).expect(HttpStatus.CREATED);
				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				expect(body.id).toBeDefined();
				expect(body).toEqual<ExternalToolResponse>({
					id: body.id,
					name: 'Tool 1',
					parameters: [
						{
							name: 'key',
							description: 'This is a parameter.',
							displayName: 'User Friendly Name',
							defaultValue: 'abc',
							isOptional: false,
							type: CustomParameterTypeParams.STRING,
							regex: 'abc',
							regexComment: 'Regex accepts "abc" as value.',
							location: CustomParameterLocationParams.PATH,
							scope: CustomParameterScopeTypeParams.GLOBAL,
						},
					],
					config: {
						type: ToolConfigType.BASIC,
						baseUrl: 'https://link.to-my-tool.com/:key',
					},
					isHidden: false,
					logoUrl: 'https://link.to-my-logo.com',
					url: 'https://link.to-my-tool.com',
					openNewTab: true,
					version: 1,
				});
			});
		});

		describe('when invalid data is given', () => {
			const setup = async () => {
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return bad request', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(undefined, { invalid: 'invalidData' });

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = () => {
				const params: ExternalToolCreateParams = { ...postParams };

				return { params };
			};

			it('should return unauthorized', async () => {
				const { params } = setup();

				const response: Response = await testApiClient.post(undefined, params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const params: ExternalToolCreateParams = { ...postParams };

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params };
			};

			it('should return unauthorized', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post(undefined, params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[GET] tools', () => {
		describe('when requesting tools', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should get all tools', async () => {
				const { loggedInClient, toolId } = await setup();

				const response: Response = await loggedInClient.get().expect(HttpStatus.OK);

				expect(response.body).toEqual<ExternalToolSearchListResponse>({
					total: 1,
					skip: 0,
					limit: 10,
					data: [expect.objectContaining<Partial<ExternalToolResponse>>({ id: toolId }) as ExternalToolResponse],
				});
			});
		});

		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.get();

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient };
			};

			it('should return unauthorized', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.get();

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[GET] tools/:toolId', () => {
		describe('when toolId is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin(undefined, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should get a tool by id', async () => {
				const { loggedInClient, toolId } = await setup();

				const response: Response = await loggedInClient.get(`${toolId}`).expect(HttpStatus.OK);

				expect(response.body).toEqual<ExternalToolResponse>(
					expect.objectContaining<Partial<ExternalToolResponse>>({ id: toolId }) as ExternalToolResponse
				);
			});
		});

		describe('when path param is not valid', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should return bad request', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.get('287182hjs');

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.get(`${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient };
			};

			it('should return unauthorized', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.get(`${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[POST] tools/:toolId', () => {
		const postParams: ExternalToolCreateParams = {
			name: 'Tool 1',
			parameters: [
				{
					name: 'key',
					description: 'This is a parameter.',
					displayName: 'User Friendly Name',
					defaultValue: 'abc',
					isOptional: false,
					type: CustomParameterTypeParams.STRING,
					regex: 'abc',
					regexComment: 'Regex accepts "abc" as value.',
					location: CustomParameterLocationParams.PATH,
					scope: CustomParameterScopeTypeParams.GLOBAL,
				},
			],
			config: {
				type: ToolConfigType.BASIC,
				baseUrl: 'https://link.to-my-tool.com/:key',
			},
			isHidden: false,
			logoUrl: 'https://link.to-my-logo.com',
			url: 'https://link.to-my-tool.com',
			openNewTab: true,
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, toolId };
			};

			it('should update a tool', async () => {
				const { loggedInClient, params, toolId } = await setup();

				const response: Response = await loggedInClient.post(`${toolId}`, params).expect(HttpStatus.CREATED);
				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				const loaded: Loaded<ExternalTool> = await em.findOneOrFail(ExternalTool, { id: body.id });

				expect(loaded).toBeDefined();
			});

			it('should return the updated tool', async () => {
				const { loggedInClient, params, toolId } = await setup();

				const response: Response = await loggedInClient.post(`${toolId}`, params).expect(HttpStatus.CREATED);
				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				expect(body.id).toBeDefined();
				expect(body).toEqual<ExternalToolResponse>({
					id: body.id,
					name: 'Tool 1',
					parameters: [
						{
							name: 'key',
							description: 'This is a parameter.',
							displayName: 'User Friendly Name',
							defaultValue: 'abc',
							isOptional: false,
							type: CustomParameterTypeParams.STRING,
							regex: 'abc',
							regexComment: 'Regex accepts "abc" as value.',
							location: CustomParameterLocationParams.PATH,
							scope: CustomParameterScopeTypeParams.GLOBAL,
						},
					],
					config: {
						type: ToolConfigType.BASIC,
						baseUrl: 'https://link.to-my-tool.com/:key',
					},
					isHidden: false,
					logoUrl: 'https://link.to-my-logo.com',
					url: 'https://link.to-my-tool.com',
					openNewTab: true,
					version: 2,
				});
			});
		});

		describe('when path param is not valid', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, toolId };
			};

			it('should return bad request', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post('287182hjs').send(params);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };

				return { params, toolId };
			};

			it('should return unauthorized', async () => {
				const { params, toolId } = setup();

				const response: Response = await testApiClient.post(`${toolId}`, params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const params = { ...postParams, id: toolId };
				const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1 }, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, toolId };
			};

			it('should return unauthorized', async () => {
				const { loggedInClient, params, toolId } = await setup();

				const response: Response = await loggedInClient.post(`${toolId}`, params);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[DELETE] tools/:toolId', () => {
		describe('when valid data is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalTool: ExternalTool = externalToolFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should delete a tool', async () => {
				const { loggedInClient, toolId } = await setup();

				await loggedInClient.delete(`${toolId}`).expect(HttpStatus.OK);

				expect(await em.findOne(ExternalTool, { id: toolId })).toBeNull();
			});
		});

		describe('when path param is not valid', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should return bad request', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.delete('asdf10202');

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.delete(`${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when permission is missing', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should return unauthorized', async () => {
				const { loggedInClient, toolId } = await setup();

				const response: Response = await loggedInClient.delete(`${toolId}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[GET] tools/references/:contextType/:contextId', () => {
		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.get(`references/contextType/${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has no access to a tool', () => {
			const setup = async () => {
				const schoolWithoutTool: School = schoolFactory.buildWithId();
				const school: School = schoolFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school: schoolWithoutTool });
				const course: Course = courseFactory.buildWithId({ school, teachers: [adminUser] });
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					course,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				]);
				em.clear();

				const params: ContextExternalToolContextParams = {
					contextId: course.id,
					contextType: ToolContextType.COURSE,
				};

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params };
			};

			it('should filter out the tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.get(`references/${params.contextType}/${params.contextId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ToolReferenceListResponse>({ data: [] });
			});
		});

		describe('when user has access for a tool', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school, teachers: [adminUser] });
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
					toolVersion: externalTool.version,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'This is a test tool',
					toolVersion: schoolExternalTool.toolVersion,
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					course,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				]);
				em.clear();

				const params: ContextExternalToolContextParams = {
					contextId: course.id,
					contextType: ToolContextType.COURSE,
				};

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, contextExternalTool, externalTool };
			};

			it('should return an ToolReferenceListResponse with data', async () => {
				const { loggedInClient, params, contextExternalTool, externalTool } = await setup();

				const response: Response = await loggedInClient.get(`references/${params.contextType}/${params.contextId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ToolReferenceListResponse>({
					data: [
						{
							contextToolId: contextExternalTool.id,
							displayName: contextExternalTool.displayName as string,
							status: ToolConfigurationStatusResponse.LATEST,
							logoUrl: externalTool.logoUrl,
							openInNewTab: externalTool.openNewTab,
						},
					],
				});
			});
		});
	});
});
