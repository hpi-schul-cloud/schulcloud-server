import { Loaded } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import {
	cleanupCollections,
	contextExternalToolEntityFactory,
	externalToolEntityFactory,
	externalToolFactory,
	schoolExternalToolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Response } from 'supertest';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	ToolConfigType,
	ToolContextType,
} from '../../../common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/entity';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { ExternalToolMetadata } from '../../domain';
import { ExternalToolEntity } from '../../entity';
import { ExternalToolCreateParams, ExternalToolResponse, ExternalToolSearchListResponse } from '../dto';
import { ExternalToolMetadataResponse } from '../dto/response/external-tool-metadata.response';

describe('ToolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;
	let axiosMock: MockAdapter;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		axiosMock = new MockAdapter(axios);

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'tools/external-tools');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[POST] tools/external-tools', () => {
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

				const base64Logo: string = externalToolFactory.withBase64Logo().build().logo as string;
				const logoBuffer: Buffer = Buffer.from(base64Logo, 'base64');
				axiosMock.onGet(params.logoUrl).reply(HttpStatus.OK, logoBuffer);

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params };
			};

			it('should create a tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post(undefined, params).expect(HttpStatus.CREATED);

				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				const loaded: Loaded<ExternalToolEntity> = await em.findOneOrFail(ExternalToolEntity, { id: body.id });

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

	describe('[GET] tools/external-tools', () => {
		describe('when requesting tools', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
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

	describe('[GET] tools/external-tools/:externalToolId', () => {
		describe('when externalToolId is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin(undefined, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
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

	describe('[POST] tools/external-tools/:externalToolId', () => {
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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory
					.withBase64Logo()
					.buildWithId({ version: 1 }, toolId);

				const base64Logo: string = externalToolEntity.logoBase64 as string;
				const logoBuffer: Buffer = Buffer.from(base64Logo, 'base64');
				axiosMock.onGet(params.logoUrl).reply(HttpStatus.OK, logoBuffer);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, toolId };
			};

			it('should update a tool', async () => {
				const { loggedInClient, params, toolId } = await setup();

				const response: Response = await loggedInClient.post(`${toolId}`, params).expect(HttpStatus.CREATED);
				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				const loaded: Loaded<ExternalToolEntity> = await em.findOneOrFail(ExternalToolEntity, { id: body.id });

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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({ version: 1 }, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
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

	describe('[DELETE] tools/external-tools/:externalToolId', () => {
		describe('when valid data is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should delete a tool', async () => {
				const { loggedInClient, toolId } = await setup();

				await loggedInClient.delete(`${toolId}`).expect(HttpStatus.NO_CONTENT);

				expect(await em.findOne(ExternalToolEntity, { id: toolId })).toBeNull();
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

	describe('[GET] tools/external-tools/:externalToolId/logo', () => {
		const setup = async () => {
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.withBase64Logo().buildWithId();

			const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
			await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

			return { loggedInClient, externalToolEntity };
		};

		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const { externalToolEntity } = await setup();

				const response: Response = await testApiClient.get(`${externalToolEntity.id}/logo`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is authenticated', () => {
			it('should return the logo', async () => {
				const { loggedInClient, externalToolEntity } = await setup();

				const response: Response = await loggedInClient.get(`${externalToolEntity.id}/logo`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toBeInstanceOf(Buffer);
			});
		});
	});

	describe('[GET] tools/external-tools/:externalToolId/metadata', () => {
		describe('when user is not authenticated', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const contextExternalToolCount = new Map<ToolContextType, number>();
				contextExternalToolCount.set(ToolContextType.COURSE, 3);
				contextExternalToolCount.set(ToolContextType.BOARD_ELEMENT, 2);
				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: contextExternalToolCount,
				});

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId, externalToolEntity, externalToolMetadata };
			};

			it('should return unauthorized', async () => {
				const { externalToolEntity } = await setup();

				const response: Response = await testApiClient.get(`${externalToolEntity.id}/metadata`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when externalToolId is given ', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const schoolToolId: string = new ObjectId().toHexString();
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId(
					{ tool: externalToolEntity },
					schoolToolId
				);
				const schoolToolId1: string = new ObjectId().toHexString();
				const schoolExternalToolEntity1: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId(
					{ tool: externalToolEntity },
					schoolToolId1
				);

				const courseExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextType: ContextExternalToolType.COURSE,
					contextId: new ObjectId().toHexString(),
				});
				const courseExternalToolEntity1: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity1,
					contextType: ContextExternalToolType.COURSE,
					contextId: new ObjectId().toHexString(),
				});
				const courseExternalToolEntity2: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextType: ContextExternalToolType.COURSE,
					contextId: new ObjectId().toHexString(),
				});

				const boardExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextType: ContextExternalToolType.BOARD_ELEMENT,
					contextId: new ObjectId().toHexString(),
				});
				const boardExternalToolEntity1: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity1,
					contextType: ContextExternalToolType.BOARD_ELEMENT,
					contextId: new ObjectId().toHexString(),
				});

				const contextExternalToolCount = new Map<ToolContextType, number>();
				contextExternalToolCount.set(ToolContextType.COURSE, 3);
				contextExternalToolCount.set(ToolContextType.BOARD_ELEMENT, 2);
				const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: contextExternalToolCount,
				});

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([
					adminAccount,
					adminUser,
					externalToolEntity,
					schoolExternalToolEntity,
					schoolExternalToolEntity1,
					courseExternalToolEntity,
					courseExternalToolEntity1,
					courseExternalToolEntity2,
					boardExternalToolEntity,
					boardExternalToolEntity1,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId, externalToolEntity, externalToolMetadata };
			};

			it('should return the metadata of externaltool', async () => {
				const { loggedInClient, externalToolEntity, externalToolMetadata } = await setup();

				const response: Response = await loggedInClient.get(`${externalToolEntity.id}/metadata`);

				const body: ExternalToolMetadataResponse = response.body as ExternalToolMetadataResponse;

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(body).toBeDefined();
				expect(body).toMatchObject<ExternalToolMetadataResponse>(externalToolMetadata);
				expect(body.schoolExternalToolCount).toEqual<number>(2);
				expect(body.contextExternalToolCountPerContext).toHaveProperty('course', 3);
				expect(body.contextExternalToolCountPerContext).toHaveProperty('boardElement', 2);
			});
		});
	});
});
