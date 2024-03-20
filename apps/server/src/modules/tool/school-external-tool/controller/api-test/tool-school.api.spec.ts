import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, ColumnBoardNode, ExternalToolElementNodeEntity, SchoolEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	accountFactory,
	columnBoardNodeFactory,
	externalToolElementNodeFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { schoolToolConfigurationStatusFactory } from '@shared/testing/factory';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/entity';
import { contextExternalToolEntityFactory } from '../../../context-external-tool/testing';
import { CustomParameterScope, CustomParameterType, ExternalToolEntity } from '../../../external-tool/entity';
import { customParameterEntityFactory, externalToolEntityFactory } from '../../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../entity';
import { schoolExternalToolEntityFactory } from '../../testing';
import {
	CustomParameterEntryParam,
	SchoolExternalToolMetadataResponse,
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
} from '../dto';

describe('ToolSchoolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	const basePath = '/tools/school-external-tools';

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		orm = app.get(MikroORM);
		testApiClient = new TestApiClient(app, basePath);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	describe('[POST] tools/school-external-tools', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolEntityFactory.buildWithId();

			const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
				Permission.SCHOOL_TOOL_ADMIN,
			]);

			const userWithMissingPermission: User = userFactory.buildWithId({ school });
			const accountWithMissingPermission: Account = accountFactory.buildWithId({
				userId: userWithMissingPermission.id,
			});

			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				version: 1,
				parameters: [
					customParameterEntityFactory.build({
						name: 'param1',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						isOptional: false,
					}),
					customParameterEntityFactory.build({
						name: 'param2',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.BOOLEAN,
						isOptional: true,
					}),
				],
			});

			const postParams: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [
					{ name: 'param1', value: 'value' },
					{ name: 'param2', value: 'false' },
				],
				isDeactivated: false,
			};

			em.persist([
				school,
				adminUser,
				adminAccount,
				userWithMissingPermission,
				accountWithMissingPermission,
				externalToolEntity,
			]);
			await em.flush();
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);
			const loggedInClientWithMissingPermission: TestApiClient = await testApiClient.login(
				accountWithMissingPermission
			);

			return {
				loggedInClientWithMissingPermission,
				loggedInClient,
				postParams,
				externalToolEntity,
			};
		};

		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, postParams } = await setup();

			const response = await loggedInClientWithMissingPermission.post().send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should create an school external tool', async () => {
			const { loggedInClient, postParams, externalToolEntity } = await setup();

			const response = await loggedInClient.post().send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.CREATED);
			expect(response.body).toEqual({
				id: expect.any(String),
				name: externalToolEntity.name,
				schoolId: postParams.schoolId,
				toolId: postParams.toolId,
				status: schoolToolConfigurationStatusFactory.build({
					isOutdatedOnScopeSchool: false,
				}),
				toolVersion: postParams.version,
				parameters: [
					{ name: 'param1', value: 'value' },
					{ name: 'param2', value: 'false' },
				],
			});

			const createdSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});
			expect(createdSchoolExternalTool).toBeDefined();
		});
	});

	describe('[DELETE] tools/school-external-tools/:schoolExternalToolId', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolEntityFactory.buildWithId();

			const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
				Permission.SCHOOL_TOOL_ADMIN,
			]);

			const userWithMissingPermission: User = userFactory.buildWithId({ school });
			const accountWithMissingPermission: Account = accountFactory.buildWithId({
				userId: userWithMissingPermission.id,
			});

			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				version: 1,
				parameters: [],
			});

			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school,
			});

			em.persist([
				school,
				adminUser,
				adminAccount,
				userWithMissingPermission,
				accountWithMissingPermission,
				externalToolEntity,
				schoolExternalToolEntity,
			]);
			await em.flush();
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);
			const loggedInClientWithMissingPermission: TestApiClient = await testApiClient.login(
				accountWithMissingPermission
			);

			return { loggedInClientWithMissingPermission, loggedInClient, schoolExternalToolEntity };
		};

		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, schoolExternalToolEntity } = await setup();

			const response = await loggedInClientWithMissingPermission.delete(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should create a school external tool', async () => {
			const { loggedInClient, schoolExternalToolEntity } = await setup();

			const response = await loggedInClient.delete(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);

			const deleted: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				id: schoolExternalToolEntity.id,
			});
			expect(deleted).toBeNull();
		});
	});

	describe('[GET] tools/school-external-tools/', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolEntityFactory.buildWithId();

			const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
				Permission.SCHOOL_TOOL_ADMIN,
			]);

			const userWithMissingPermission: User = userFactory.buildWithId({ school });
			const accountWithMissingPermission: Account = accountFactory.buildWithId({
				userId: userWithMissingPermission.id,
			});

			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				version: 1,
				parameters: [],
			});

			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school,
			});

			const params: SchoolExternalToolSearchParams = {
				schoolId: school.id,
			};

			em.persist([
				school,
				adminUser,
				adminAccount,
				userWithMissingPermission,
				accountWithMissingPermission,
				externalToolEntity,
				schoolExternalToolEntity,
			]);
			await em.flush();
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);
			const loggedInClientWithMissingPermission: TestApiClient = await testApiClient.login(
				accountWithMissingPermission
			);

			return {
				loggedInClientWithMissingPermission,
				loggedInClient,
				externalToolEntity,
				schoolExternalToolEntity,
				params,
				school,
			};
		};

		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, params } = await setup();

			const response = await loggedInClientWithMissingPermission.get().query(params);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should return found schoolExternalTools for given school', async () => {
			const { loggedInClient, schoolExternalToolEntity, externalToolEntity, params, school } = await setup();

			const response = await loggedInClient.get().query(params);

			expect(response.statusCode).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(
				expect.objectContaining(<SchoolExternalToolSearchListResponse>{
					data: [
						{
							id: schoolExternalToolEntity.id,
							name: externalToolEntity.name,
							schoolId: school.id,
							toolId: externalToolEntity.id,
							status: schoolToolConfigurationStatusFactory.build({
								isOutdatedOnScopeSchool: true,
							}),
							toolVersion: schoolExternalToolEntity.toolVersion,
							parameters: [
								{
									name: schoolExternalToolEntity.schoolParameters[0].name,
									value: schoolExternalToolEntity.schoolParameters[0].value,
								},
							],
						},
					],
				})
			);
		});
	});

	describe('[GET] tools/school-external-tools/:schoolExternalToolId', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolEntityFactory.buildWithId();

			const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
				Permission.SCHOOL_TOOL_ADMIN,
			]);

			const userWithMissingPermission: User = userFactory.buildWithId({ school });
			const accountWithMissingPermission: Account = accountFactory.buildWithId({
				userId: userWithMissingPermission.id,
			});

			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				version: 1,
				parameters: [],
			});

			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school,
			});

			const schoolExternalToolResponse: SchoolExternalToolResponse = new SchoolExternalToolResponse({
				id: schoolExternalToolEntity.id,
				name: '',
				schoolId: school.id,
				toolId: externalToolEntity.id,
				status: schoolToolConfigurationStatusFactory.build({
					isOutdatedOnScopeSchool: false,
				}),
				toolVersion: schoolExternalToolEntity.toolVersion,
				parameters: [
					{
						name: schoolExternalToolEntity.schoolParameters[0].name,
						value: schoolExternalToolEntity.schoolParameters[0].value,
					},
				],
			});

			em.persist([
				school,
				adminUser,
				adminAccount,
				userWithMissingPermission,
				accountWithMissingPermission,
				externalToolEntity,
				schoolExternalToolEntity,
			]);
			await em.flush();
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);
			const loggedInClientWithMissingPermission: TestApiClient = await testApiClient.login(
				accountWithMissingPermission
			);

			return {
				loggedInClientWithMissingPermission,
				loggedInClient,
				schoolExternalToolEntity,
				schoolExternalToolResponse,
			};
		};

		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, schoolExternalToolEntity } = await setup();

			const response = await loggedInClientWithMissingPermission.get(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should return found schoolExternalTool for given school', async () => {
			const { loggedInClient, schoolExternalToolEntity, schoolExternalToolResponse } = await setup();

			const response = await loggedInClient.get(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(schoolExternalToolResponse);
		});
	});

	describe('[PUT] tools/school-external-tools/:schoolExternalToolId', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolEntityFactory.buildWithId();

			const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
				Permission.SCHOOL_TOOL_ADMIN,
			]);
			const userWithMissingPermission: User = userFactory.buildWithId({ school });
			const accountWithMissingPermission: Account = accountFactory.buildWithId({
				userId: userWithMissingPermission.id,
			});

			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				version: 1,
				parameters: [
					customParameterEntityFactory.build({
						name: 'param1',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						isOptional: false,
					}),
				],
			});
			const externalToolEntity2: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				version: 1,
				parameters: [],
			});

			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity2,
				school,
			});

			em.persist([
				adminUser,
				adminAccount,
				school,
				adminUser,
				userWithMissingPermission,
				accountWithMissingPermission,
				externalToolEntity,
				externalToolEntity2,
				schoolExternalToolEntity,
			]);
			await em.flush();
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);
			const loggedInClientWithMissingPermission: TestApiClient = await testApiClient.login(
				accountWithMissingPermission
			);

			const paramEntry: CustomParameterEntryParam = { name: 'param1', value: 'value' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [paramEntry],
				isDeactivated: false,
			};

			const updatedParamEntry: CustomParameterEntryParam = { name: 'param1', value: 'updatedValue' };
			const postParamsUpdate: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [updatedParamEntry],
				isDeactivated: false,
			};

			const schoolExternalToolResponse: SchoolExternalToolResponse = new SchoolExternalToolResponse({
				id: schoolExternalToolEntity.id,
				name: externalToolEntity.name,
				schoolId: postParamsUpdate.schoolId,
				toolId: postParamsUpdate.toolId,
				status: schoolToolConfigurationStatusFactory.build({
					isOutdatedOnScopeSchool: false,
				}),
				toolVersion: postParamsUpdate.version,
				parameters: [
					{
						name: updatedParamEntry.name,
						value: updatedParamEntry.value,
					},
				],
			});

			return {
				postParams,
				postParamsUpdate,
				loggedInClient,
				loggedInClientWithMissingPermission,
				schoolExternalToolEntity,
				schoolExternalToolResponse,
			};
		};

		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, schoolExternalToolEntity, postParams } = await setup();

			const response = await loggedInClientWithMissingPermission.put(`${schoolExternalToolEntity.id}`).send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should update an existing school external tool', async () => {
			const { loggedInClient, schoolExternalToolEntity, postParamsUpdate, schoolExternalToolResponse } = await setup();

			const response = await loggedInClient.put(`${schoolExternalToolEntity.id}`).send(postParamsUpdate);

			expect(response.statusCode).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(schoolExternalToolResponse);

			const updatedSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParamsUpdate.schoolId,
				tool: postParamsUpdate.toolId,
			});

			expect(updatedSchoolExternalTool).toBeDefined();
		});
	});

	describe('[GET] tools/school-external-tools/:schoolExternalToolId/metadata', () => {
		describe('when user is not authenticated', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId(undefined, toolId);

				return { toolId, externalToolEntity };
			};

			it('should return unauthorized', async () => {
				const { externalToolEntity } = setup();

				const response = await testApiClient.get(`${externalToolEntity.id}/metadata`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when schoolExternalToolId is given ', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const schoolToolId: string = new ObjectId().toHexString();
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId(
					{ school },
					schoolToolId
				);

				const courseExternalToolEntitys: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(3, {
					schoolTool: schoolExternalToolEntity,
					contextType: ContextExternalToolType.COURSE,
					contextId: new ObjectId().toHexString(),
				});

				const boardExternalToolEntitys: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(2, {
					schoolTool: schoolExternalToolEntity,
					contextType: ContextExternalToolType.BOARD_ELEMENT,
					contextId: new ObjectId().toHexString(),
				});

				const board: ColumnBoardNode = columnBoardNodeFactory.buildWithId();
				const externalToolElements: ExternalToolElementNodeEntity[] = externalToolElementNodeFactory.buildListWithId(
					2,
					{
						contextExternalTool: boardExternalToolEntitys[0],
						parent: board,
					}
				);

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.SCHOOL_TOOL_ADMIN,
				]);

				await em.persistAndFlush([
					adminAccount,
					adminUser,
					schoolExternalToolEntity,
					...courseExternalToolEntitys,
					...boardExternalToolEntitys,
					board,
					...externalToolElements,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, schoolExternalToolEntity };
			};

			it('should return the metadata of schoolExternalTool', async () => {
				const { loggedInClient, schoolExternalToolEntity } = await setup();

				const response = await loggedInClient.get(`${schoolExternalToolEntity.id}/metadata`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<SchoolExternalToolMetadataResponse>({
					contextExternalToolCountPerContext: {
						course: 1,
						boardElement: 1,
					},
				});
			});
		});
	});
});
