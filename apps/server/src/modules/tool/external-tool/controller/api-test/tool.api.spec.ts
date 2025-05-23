import { fileRecordResponseFactory } from '@infra/files-storage-client/testing';
import { Loaded } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { columnBoardEntityFactory, externalToolElementEntityFactory } from '@modules/board/testing';
import { instanceEntityFactory } from '@modules/instance/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Response } from 'supertest';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	ToolConfigType,
} from '../../../common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/repo';
import { contextExternalToolEntityFactory } from '../../../context-external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ExternalToolMediumStatus } from '../../enum';
import { ExternalToolEntity } from '../../repo';
import { base64TestLogo, externalToolEntityFactory } from '../../testing';
import {
	ExternalToolBulkCreateParams,
	ExternalToolCreateParams,
	ExternalToolImportResultListResponse,
	ExternalToolImportResultResponse,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolUtilizationResponse,
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

	afterEach(async () => {
		axiosMock.reset();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
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
			thumbnailUrl: 'https://link.to-my-thumbnail.com',
			isPreferred: true,
			iconName: 'mdiAlert',
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const params: ExternalToolCreateParams = { ...postParams };
				const instance = instanceEntityFactory.build();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, instance]);
				em.clear();

				const logoBuffer: Buffer = Buffer.from(base64TestLogo, 'base64');
				axiosMock.onGet(params.logoUrl).reply(HttpStatus.OK, logoBuffer, { 'content-type': 'image/png' });

				const fileRecordResponse = fileRecordResponseFactory.build();
				axiosMock.onPost(/api\/v3\/file\/upload-from-url/).reply(HttpStatus.OK, fileRecordResponse);

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, fileRecordResponse };
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
					thumbnailUrl: postParams.thumbnailUrl,
					isPreferred: true,
					iconName: 'mdiAlert',
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

	describe('[POST] tools/external-tools/import', () => {
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
				status: ExternalToolMediumStatus.ACTIVE,
				mediumId: 'medium:1',
				mediaSourceId: 'source:1',
			},
			thumbnailUrl: 'https://link.to-my-thumbnail.com',
			isPreferred: false,
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const params: ExternalToolBulkCreateParams = { data: [{ ...postParams }] };

				const instance = instanceEntityFactory.build();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, instance]);
				em.clear();

				const logoBuffer: Buffer = Buffer.from(base64TestLogo, 'base64');
				axiosMock.onGet(logoUrl).reply(HttpStatus.OK, logoBuffer, { 'content-type': 'image/png' });

				const fileRecordResponse = fileRecordResponseFactory.build();
				axiosMock.onPost(/api\/v3\/file\/upload-from-url/).reply(HttpStatus.OK, fileRecordResponse);

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

				const externalTool = externalToolEntityFactory.build();

				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					externalTool,
				};
			};

			it('should return forbidden', async () => {
				const { loggedInClient, externalTool } = await setup();

				const response: Response = await loggedInClient.get(externalTool.id);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
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
			thumbnailUrl: 'https://link.to-my-thumbnail2.com',
			openNewTab: true,
			medium: {
				status: ExternalToolMediumStatus.ACTIVE,
				mediumId: 'mediumId',
				mediaSourceId: 'mediaSourceId',
				publisher: 'publisher',
			},
			isPreferred: false,
		};

		describe('when valid data is given', () => {
			const setup = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory
					.withBase64Logo()
					.withMedium()
					.buildWithId();

				const params = { ...postParams, id: externalToolEntity.id };

				const logoBuffer: Buffer = Buffer.from(base64TestLogo, 'base64');
				axiosMock.onGet(params.logoUrl).reply(HttpStatus.OK, logoBuffer, { 'content-type': 'image/png' });

				const fileRecordResponse = fileRecordResponseFactory.build();
				axiosMock.onDelete(/api\/v3\/file\/delete/).reply(HttpStatus.OK);
				axiosMock.onPost(/api\/v3\/file\/upload-from-url/).reply(HttpStatus.OK, fileRecordResponse);

				const instance = instanceEntityFactory.build();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity, instance]);
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
						status: ExternalToolMediumStatus.ACTIVE,
						mediaSourceId: params.medium?.mediaSourceId ?? '',
						mediumId: params.medium?.mediumId ?? '',
						publisher: params.medium?.publisher,
					},
					thumbnailUrl: 'https://link.to-my-thumbnail2.com',
					isPreferred: false,
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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, toolId };
			};

			it('should return forbidden', async () => {
				const { loggedInClient, params, toolId } = await setup();

				const response: Response = await loggedInClient.post(toolId, params);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
			});
		});
	});

	describe('[DELETE] tools/external-tools/:externalToolId', () => {
		describe('when valid data is given', () => {
			const setup = async () => {
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				const instance = instanceEntityFactory.build();
				await em.persistAndFlush([adminAccount, adminUser, externalToolEntity, instance]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				axiosMock.onDelete(/api\/v3\/file\/delete/).reply(HttpStatus.OK);

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
				const externalTool = externalToolEntityFactory.build();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();
				await em.persistAndFlush([adminAccount, adminUser, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, externalTool };
			};

			it('should return forbidden', async () => {
				const { loggedInClient, externalTool } = await setup();

				const response: Response = await loggedInClient.delete(externalTool.id);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
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
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.build({ id: toolId });

				const school = schoolEntityFactory.build();
				const schoolExternalToolEntities = schoolExternalToolEntityFactory.buildList(2, {
					tool: externalToolEntity,
					school,
				});

				const courseTools: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(3, {
					schoolTool: schoolExternalToolEntities[0],
					contextType: ContextExternalToolType.COURSE,
					contextId: new ObjectId().toHexString(),
				});

				const boardTools: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildListWithId(2, {
					schoolTool: schoolExternalToolEntities[1],
					contextType: ContextExternalToolType.BOARD_ELEMENT,
					contextId: new ObjectId().toHexString(),
				});

				const mediaBoardTools: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildListWithId(2, {
					schoolTool: schoolExternalToolEntities[1],
					contextType: ContextExternalToolType.MEDIA_BOARD,
					contextId: new ObjectId().toHexString(),
				});

				const board = columnBoardEntityFactory.build();
				const externalToolElements = externalToolElementEntityFactory
					.withParent(board)
					.buildList(2, { contextExternalToolId: boardTools[0].id });

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);
				await em.persistAndFlush([
					adminAccount,
					adminUser,
					school,
					externalToolEntity,
					...schoolExternalToolEntities,
					...courseTools,
					...boardTools,
					...mediaBoardTools,
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
				expect(response.body).toEqual<ExternalToolUtilizationResponse>({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: {
						course: 1,
						boardElement: 1,
						mediaBoard: 1,
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
