import { EntityManager, MikroORM } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Permission, School, User } from '@shared/domain';
import {
	accountFactory,
	externalToolEntityFactory,
	schoolExternalToolEntityFactory,
	schoolFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import {
	CustomParameterEntryParam,
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
} from '../dto';
import { ToolConfigurationStatusResponse } from '../../../external-tool/controller/dto';
import { SchoolExternalToolEntity } from '../../entity';
import { ExternalToolEntity } from '../../../external-tool/entity';

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

	const setup = async () => {
		const school: School = schoolFactory.buildWithId();

		const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
			Permission.SCHOOL_TOOL_ADMIN,
		]);
		const userWithMissingPermission: User = userFactory.buildWithId({ school });
		const accountWithMissingPermission: Account = accountFactory.buildWithId({ userId: userWithMissingPermission.id });

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
		const loggedInClientWithMissingPermission: TestApiClient = await testApiClient.login(accountWithMissingPermission);

		const paramEntry: CustomParameterEntryParam = { name: 'name', value: 'value' };
		const postParams: SchoolExternalToolPostParams = {
			toolId: externalToolEntity.id,
			schoolId: school.id,
			version: 1,
			parameters: [paramEntry],
		};

		const params: SchoolExternalToolSearchParams = {
			schoolId: school.id,
		};

		const updatedParamEntry: CustomParameterEntryParam = { name: 'name', value: 'updatedValue' };
		const postParamsUpdate: SchoolExternalToolPostParams = {
			toolId: externalToolEntity.id,
			schoolId: school.id,
			version: 1,
			parameters: [updatedParamEntry],
		};

		return {
			params,
			postParams,
			postParamsUpdate,
			paramEntry,
			updatedParamEntry,
			externalToolEntity,
			externalToolEntity2,
			school,
			loggedInClient,
			loggedInClientWithMissingPermission,
			schoolExternalToolEntity,
		};
	};

	describe('[POST] tools/school-external-tools', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, postParams } = await setup();

			const response = await loggedInClientWithMissingPermission.post().send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should create an school external tool', async () => {
			const { externalToolEntity, loggedInClient, postParams, paramEntry } = await setup();

			const response = await loggedInClient.post().send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.CREATED);
			expect(response.body).toEqual(
				expect.objectContaining(<SchoolExternalToolResponse>{
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
				})
			);

			const createdSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});
			expect(createdSchoolExternalTool).toBeDefined();
		});
	});

	describe('[DELETE] tools/school-external-tools/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, schoolExternalToolEntity } = await setup();

			const response = await loggedInClientWithMissingPermission.delete(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should create an school external tool', async () => {
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
		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, params } = await setup();

			const response = await loggedInClientWithMissingPermission.get().query(params);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should return found schoolExternalTools for given school', async () => {
			const { loggedInClient, schoolExternalToolEntity, externalToolEntity2, params, school } = await setup();

			const response = await loggedInClient.get().query(params);

			expect(response.statusCode).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(
				expect.objectContaining(<SchoolExternalToolSearchListResponse>{
					data: [
						{
							id: schoolExternalToolEntity.id,
							name: externalToolEntity2.name,
							schoolId: school.id,
							toolId: externalToolEntity2.id,
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
		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, schoolExternalToolEntity } = await setup();

			const response = await loggedInClientWithMissingPermission.get(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should return found schoolExternalTool for given school', async () => {
			const { loggedInClient, schoolExternalToolEntity, externalToolEntity2, school } = await setup();

			const response = await loggedInClient.get(`${schoolExternalToolEntity.id}`);

			expect(response.statusCode).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(
				expect.objectContaining(<SchoolExternalToolResponse>{
					id: schoolExternalToolEntity.id,
					name: '',
					schoolId: school.id,
					toolId: externalToolEntity2.id,
					status: ToolConfigurationStatusResponse.UNKNOWN,
					toolVersion: schoolExternalToolEntity.toolVersion,
					parameters: [
						{
							name: schoolExternalToolEntity.schoolParameters[0].name,
							value: schoolExternalToolEntity.schoolParameters[0].value,
						},
					],
				})
			);
		});
	});

	describe('[PUT] tools/school-external-tools/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { loggedInClientWithMissingPermission, schoolExternalToolEntity, postParams } = await setup();

			const response = await loggedInClientWithMissingPermission.put(`${schoolExternalToolEntity.id}`).send(postParams);

			expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
		});

		it('should update an existing school external tool', async () => {
			const { externalToolEntity, loggedInClient, schoolExternalToolEntity, postParamsUpdate, updatedParamEntry } =
				await setup();

			const response = await loggedInClient.put(`${schoolExternalToolEntity.id}`).send(postParamsUpdate);

			expect(response.statusCode).toEqual(HttpStatus.OK);
			expect(response.body).toEqual(
				expect.objectContaining(<SchoolExternalToolResponse>{
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
				})
			);

			const updatedSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParamsUpdate.schoolId,
				tool: postParamsUpdate.toolId,
			});

			expect(updatedSchoolExternalTool).toBeDefined();
		});
	});
});
