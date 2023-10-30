import { EntityManager, MikroORM } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@shared/domain/entity/account.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { accountFactory } from '@shared/testing/factory/account.factory';
import { externalToolEntityFactory } from '@shared/testing/factory/external-tool-entity.factory';
import { schoolExternalToolEntityFactory } from '@shared/testing/factory/school-external-tool-entity.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { UserAndAccountTestFactory } from '@shared/testing/factory/user-and-account.test.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { TestApiClient } from '@shared/testing/test-api-client';
import { ServerTestModule } from '@src/modules/server/server.module';
import { ToolConfigurationStatusResponse } from '@src/modules/tool/context-external-tool/controller/dto/tool-configuration-status.response';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity/external-tool.entity';
import { SchoolExternalToolEntity } from '../../entity/school-external-tool.entity';
import { CustomParameterEntryParam } from '../dto/custom-parameter-entry.params';
import { SchoolExternalToolPostParams } from '../dto/school-external-tool-post.params';
import { SchoolExternalToolSearchListResponse } from '../dto/school-external-tool-search-list.response';
import { SchoolExternalToolSearchParams } from '../dto/school-external-tool-search.params';
import { SchoolExternalToolResponse } from '../dto/school-external-tool.response';

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
			const school: SchoolEntity = schoolFactory.buildWithId();

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

			const paramEntry: CustomParameterEntryParam = { name: 'name', value: 'value' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [paramEntry],
			};

			const schoolExternalToolResponse: SchoolExternalToolResponse = new SchoolExternalToolResponse({
				id: expect.any(String),
				name: externalToolEntity.name,
				schoolId: postParams.schoolId,
				toolId: postParams.toolId,
				status: ToolConfigurationStatusResponse.LATEST,
				toolVersion: postParams.version,
				parameters: [
					{
						name: paramEntry.name,
						value: paramEntry.value,
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
				schoolExternalToolResponse,
			};
		};

		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, postParams } = await setup();

			const response = await loggedInClientWithMissingPermission.post().send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should create an school external tool', async () => {
			const { loggedInClient, postParams, schoolExternalToolResponse } = await setup();

			const response = await loggedInClient.post().send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.CREATED);
			expect(response.body).toEqual(schoolExternalToolResponse);

			const createdSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});
			expect(createdSchoolExternalTool).toBeDefined();
		});
	});

	describe('[DELETE] tools/school-external-tools/:schoolExternalToolId', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolFactory.buildWithId();

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
			const school: SchoolEntity = schoolFactory.buildWithId();

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
							status: ToolConfigurationStatusResponse.OUTDATED,
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
			const school: SchoolEntity = schoolFactory.buildWithId();

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
				status: ToolConfigurationStatusResponse.UNKNOWN,
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
			const school: SchoolEntity = schoolFactory.buildWithId();

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

			const paramEntry: CustomParameterEntryParam = { name: 'name', value: 'value' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [paramEntry],
			};

			const updatedParamEntry: CustomParameterEntryParam = { name: 'name', value: 'updatedValue' };
			const postParamsUpdate: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [updatedParamEntry],
			};

			const schoolExternalToolResponse: SchoolExternalToolResponse = new SchoolExternalToolResponse({
				id: schoolExternalToolEntity.id,
				name: externalToolEntity.name,
				schoolId: postParamsUpdate.schoolId,
				toolId: postParamsUpdate.toolId,
				status: ToolConfigurationStatusResponse.LATEST,
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
});
