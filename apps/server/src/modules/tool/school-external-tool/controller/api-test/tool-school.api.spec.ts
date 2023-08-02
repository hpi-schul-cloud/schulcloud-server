import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, Role, RoleName, School, User } from '@shared/domain';
import {
	externalToolEntityFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolEntityFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { ObjectId } from 'bson';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import {
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

	let currentUser: ICurrentUser;

	const basePath = '/tools/school-external-tools';

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
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

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		orm = app.get(MikroORM);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	const setup = async () => {
		const adminRole: Role = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.SCHOOL_TOOL_ADMIN],
		});
		const school: School = schoolFactory.buildWithId();

		const adminUser: User = userFactory.buildWithId({ school, roles: [adminRole] });
		const userWithMissingPermission: User = userFactory.buildWithId({ school });

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
			adminRole,
			school,
			adminUser,
			userWithMissingPermission,
			externalToolEntity,
			externalToolEntity2,
			schoolExternalToolEntity,
		]);
		await em.flush();
		em.clear();

		return {
			externalToolEntity,
			externalToolEntity2,
			school,
			adminUser,
			userWithMissingPermission,
			schoolExternalToolEntity,
		};
	};

	describe('[POST] tools/school-external-tools', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);
			const randomTestId = new ObjectId().toString();
			const postParams: SchoolExternalToolPostParams = {
				toolId: randomTestId,
				schoolId: randomTestId,
				version: 1,
				parameters: [],
			};

			await request(app.getHttpServer()).post(basePath).send(postParams).expect(403);
		});

		it('should create an school external tool', async () => {
			const { externalToolEntity, school, adminUser } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);
			const paramEntry = { name: 'name', value: 'value' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [paramEntry],
			};

			await request(app.getHttpServer())
				.post(basePath)
				.send(postParams)
				.expect(201)
				.then((res: Response) => {
					expect(res.body).toEqual(
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
					return res;
				});

			const createdSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});
			expect(createdSchoolExternalTool).toBeDefined();
		});
	});

	describe('[DELETE] tools/school-external-tools/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, schoolExternalToolEntity } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);

			await request(app.getHttpServer()).delete(`${basePath}/${schoolExternalToolEntity.id}`).expect(403);
		});

		it('should create an school external tool', async () => {
			const { adminUser, schoolExternalToolEntity } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);

			await request(app.getHttpServer()).delete(`${basePath}/${schoolExternalToolEntity.id}`).expect(204);

			const deleted: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				id: schoolExternalToolEntity.id,
			});
			expect(deleted).toBeNull();
		});
	});

	describe('[GET] tools/school-external-tools/', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, school } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);
			const params: SchoolExternalToolSearchParams = {
				schoolId: school.id,
			};

			await request(app.getHttpServer()).get(basePath).query(params).expect(403);
		});

		it('should return found schoolExternalTools for given school', async () => {
			const { adminUser, schoolExternalToolEntity, externalToolEntity2, school } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);
			const params: SchoolExternalToolSearchParams = {
				schoolId: school.id,
			};

			await request(app.getHttpServer())
				.get(basePath)
				.query(params)
				.expect(200)
				.then((res: Response) => {
					expect(res.body).toEqual(
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
					return res;
				});
		});
	});

	describe('[GET] tools/school-external-tools/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, schoolExternalToolEntity } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);

			await request(app.getHttpServer()).get(`${basePath}/${schoolExternalToolEntity.id}`).expect(403);
		});

		it('should return found schoolExternalTool for given school', async () => {
			const { adminUser, schoolExternalToolEntity, externalToolEntity2, school } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);

			await request(app.getHttpServer())
				.get(`${basePath}/${schoolExternalToolEntity.id}`)
				.expect(200)
				.then((res: Response) => {
					expect(res.body).toEqual(
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
					return res;
				});
		});
	});

	describe('[PUT] tools/school-external-tools/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, schoolExternalToolEntity } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);
			const paramEntry = { name: 'name', value: 'Updatedvalue' };
			const randomTestId = new ObjectId().toString();
			const postParams: SchoolExternalToolPostParams = {
				toolId: randomTestId,
				schoolId: randomTestId,
				version: 1,
				parameters: [paramEntry],
			};

			await request(app.getHttpServer()).put(`${basePath}/${schoolExternalToolEntity.id}`).send(postParams).expect(403);
		});

		it('should update an existing school external tool', async () => {
			const { externalToolEntity, school, adminUser, schoolExternalToolEntity } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);
			const paramEntry = { name: 'name', value: 'Updatedvalue' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalToolEntity.id,
				schoolId: school.id,
				version: 1,
				parameters: [paramEntry],
			};

			await request(app.getHttpServer())
				.put(`${basePath}/${schoolExternalToolEntity.id}`)
				.send(postParams)
				.expect(200)
				.then((res: Response) => {
					expect(res.body).toEqual(
						expect.objectContaining(<SchoolExternalToolResponse>{
							id: schoolExternalToolEntity.id,
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
					return res;
				});

			const updatedSchoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});

			expect(updatedSchoolExternalTool).toBeDefined();
		});
	});
});
