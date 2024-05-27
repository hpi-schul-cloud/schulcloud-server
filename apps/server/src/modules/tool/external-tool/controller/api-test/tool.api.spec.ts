import { Loaded } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnBoardNode, ExternalToolElementNodeEntity, SchoolEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	columnBoardNodeFactory,
	externalToolElementNodeFactory,
	schoolEntityFactory,
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
} from '../../../common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/entity';
import { contextExternalToolEntityFactory } from '../../../context-external-tool/testing';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { ExternalToolEntity } from '../../entity';
import { externalToolEntityFactory, externalToolFactory } from '../../testing';
import {
	ExternalToolBulkCreateParams,
	ExternalToolCreateParams,
	ExternalToolImportResultListResponse,
	ExternalToolImportResultResponse,
	ExternalToolMetadataResponse,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
} from '../dto';

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
					isProtected: false,
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
			isDeactivated: false,
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
							isProtected: false,
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
					isDeactivated: false,
					logoUrl: 'https://link.to-my-logo.com',
					url: 'https://link.to-my-tool.com',
					openNewTab: true,
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

	describe('[POST] tools/external-tools', () => {
		const logoUrl = 'https://link.to-my-logo.com';
		const postParams: ExternalToolCreateParams = {
			name: 'Tool 1',
			parameters: [
				{
					name: 'key',
					description: 'This is a parameter.',
					displayName: 'User Friendly Name',
					defaultValue: 'abc',
					isOptional: false,
					isProtected: false,
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
			isDeactivated: false,
			logoUrl,
			url: 'https://link.to-my-tool.com',
			openNewTab: true,
			medium: {
				mediumId: 'medium:1',
				mediaSourceId: 'source:1',
			},
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const params: ExternalToolBulkCreateParams = { data: [{ ...postParams }] };

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const base64Logo: string = externalToolFactory.withBase64Logo().build().logo as string;
				const logoBuffer: Buffer = Buffer.from(base64Logo, 'base64');
				axiosMock.onGet(logoUrl).reply(HttpStatus.OK, logoBuffer);

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					params,
				};
			};

			it('should create a tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post('/import', params);
				const body: ExternalToolImportResultListResponse = response.body as ExternalToolImportResultListResponse;

				expect(body.results[0]?.toolId).toBeDefined();
				const loaded: Loaded<ExternalToolEntity> = await em.findOneOrFail(ExternalToolEntity, {
					id: body.results[0].toolId,
				});
				expect(loaded).toBeDefined();
			});

			it('should return the created tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.post('/import', params);
				const body: ExternalToolImportResultListResponse = response.body as ExternalToolImportResultListResponse;

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(body.results[0]).toBeDefined();
				expect(body.results[0]).toEqual<ExternalToolImportResultResponse>({
					toolId: expect.any(String),
					mediumId: postParams.medium?.mediumId,
					mediumSourceId: postParams.medium?.mediaSourceId,
					toolName: postParams.name,
					error: undefined,
				});
			});
		});

		describe('when user is not authenticated', () => {
			const setup = () => {
				const params: ExternalToolBulkCreateParams = { data: [{ ...postParams }] };

				return { params };
			};

			it('should return unauthorized', async () => {
				const { params } = setup();

				const response: Response = await testApiClient.post('/import', params);

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
			description: 'This is a tool description',
			parameters: [
				{
					name: 'key',
					description: 'This is a parameter.',
					displayName: 'User Friendly Name',
					defaultValue: 'abc',
					isOptional: false,
					isProtected: false,
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
			isDeactivated: false,
			logoUrl: 'https://link.to-my-logo.com',
			url: 'https://link.to-my-tool.com',
			openNewTab: true,
			medium: {
				mediumId: 'mediumId',
				publisher: 'publisher',
			},
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory
					.withBase64Logo()
					.withMedium()
					.buildWithId();

				const params = { ...postParams, id: externalToolEntity.id };

				const base64Logo: string = externalToolEntity.logoBase64 as string;
				const logoBuffer: Buffer = Buffer.from(base64Logo, 'base64');
				axiosMock.onGet(params.logoUrl).reply(HttpStatus.OK, logoBuffer);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, toolId: externalToolEntity.id };
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
					name: params.name,
					description: params.description,
					parameters: [
						{
							name: 'key',
							description: 'This is a parameter.',
							displayName: 'User Friendly Name',
							defaultValue: 'abc',
							isOptional: false,
							isProtected: false,
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
					isDeactivated: false,
					logoUrl: 'https://link.to-my-logo.com',
					url: 'https://link.to-my-tool.com',
					openNewTab: true,
					medium: {
						mediumId: params.medium?.mediumId ?? '',
						publisher: params.medium?.publisher,
					},
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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({ id: toolId });

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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId: externalToolEntity.id };
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
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				return { toolId };
			};

			it('should return unauthorized', async () => {
				const { toolId } = setup();

				const response: Response = await testApiClient.get(`${toolId}/metadata`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when externalToolId is given ', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const schoolExternalToolEntitys: SchoolExternalToolEntity[] = schoolExternalToolEntityFactory.buildList(2, {
					tool: externalToolEntity,
					school,
				});

				const courseTools: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(3, {
					schoolTool: schoolExternalToolEntitys[0],
					contextType: ContextExternalToolType.COURSE,
					contextId: new ObjectId().toHexString(),
				});

				const boardTools: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(2, {
					schoolTool: schoolExternalToolEntitys[1],
					contextType: ContextExternalToolType.BOARD_ELEMENT,
					contextId: new ObjectId().toHexString(),
				});

				const board: ColumnBoardNode = columnBoardNodeFactory.buildWithId();
				const externalToolElements: ExternalToolElementNodeEntity[] = externalToolElementNodeFactory.buildListWithId(
					2,
					{
						contextExternalTool: boardTools[0],
						parent: board,
					}
				);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([
					adminAccount,
					adminUser,
					school,
					externalToolEntity,
					...schoolExternalToolEntitys,
					...courseTools,
					...boardTools,
					board,
					...externalToolElements,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId, externalToolEntity };
			};

			it('should return the metadata of externalTool', async () => {
				const { loggedInClient, externalToolEntity } = await setup();

				const response: Response = await loggedInClient.get(`${externalToolEntity.id}/metadata`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ExternalToolMetadataResponse>({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: {
						course: 1,
						boardElement: 1,
					},
				});
			});
		});
	});

	describe('[GET] tools/external-tools/:externalToolId/datasheet', () => {
		describe('when user is not authenticated', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				return { toolId };
			};

			it('should return unauthorized', async () => {
				const { toolId } = setup();

				const response: Response = await testApiClient.get(`${toolId}/datasheet`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when externalToolId is given', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				// this date will only have a daily precision, which should not impact successful tests
				const date = new Date();
				const year = date.getFullYear();
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const dateString = `${year}-${month}-${day}`;

				return { loggedInClient, externalToolEntity, dateString };
			};

			it('should return the datasheet of the externalTool', async () => {
				const { loggedInClient, externalToolEntity, dateString } = await setup();

				const response: Response = await loggedInClient.get(`${externalToolEntity.id}/datasheet`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.header).toEqual(
					expect.objectContaining({
						'content-type': 'application/pdf',
						'content-disposition': `inline; filename=CTL-Datenblatt-${externalToolEntity.name}-${dateString}.pdf`,
					})
				);
				expect(response.body).toEqual(expect.any(Buffer));
			});
		});

		describe('when external tool cannot be found', () => {
			const setup = async () => {
				const toolId: string = new ObjectId().toHexString();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, toolId };
			};

			it('should return a not found exception', async () => {
				const { loggedInClient, toolId } = await setup();

				const response: Response = await loggedInClient.get(`${toolId}/datasheet`);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});
