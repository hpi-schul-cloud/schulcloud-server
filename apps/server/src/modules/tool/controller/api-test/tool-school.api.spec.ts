import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalTool, Permission, Role, RoleName, School, SchoolExternalTool, User } from '@shared/domain';
import {
	externalToolFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { ObjectId } from 'bson';
import { Request } from 'express';
import request, { Response } from 'supertest';
import {
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
	SchoolExternalToolStatusResponse,
} from '../dto';

describe('ToolSchoolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser;

	const basePath = '/tools/school';

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

		const externalTool: ExternalTool = externalToolFactory.buildWithId({ version: 1, parameters: [] });
		const externalTool2: ExternalTool = externalToolFactory.buildWithId({ version: 1, parameters: [] });

		const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
			tool: externalTool2,
			school,
		});

		em.persist([
			adminRole,
			school,
			adminUser,
			userWithMissingPermission,
			externalTool,
			externalTool2,
			schoolExternalTool,
		]);
		await em.flush();
		em.clear();

		return {
			externalTool,
			externalTool2,
			school,
			adminUser,
			userWithMissingPermission,
			schoolExternalTool,
		};
	};

	describe('[POST] tools/school', () => {
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
			const { externalTool, school, adminUser } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);
			const paramEntry = { name: 'name', value: 'value' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalTool.id,
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
							name: externalTool.name,
							schoolId: postParams.schoolId,
							toolId: postParams.toolId,
							status: SchoolExternalToolStatusResponse.LATEST,
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

			const createdSchoolExternalTool: SchoolExternalTool | null = await em.findOne(SchoolExternalTool, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});
			expect(createdSchoolExternalTool).toBeDefined();
		});
	});

	describe('[DELETE] tools/school/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, schoolExternalTool } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);

			await request(app.getHttpServer()).delete(`${basePath}/${schoolExternalTool.id}`).expect(403);
		});

		it('should create an school external tool', async () => {
			const { adminUser, schoolExternalTool } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);

			await request(app.getHttpServer()).delete(`${basePath}/${schoolExternalTool.id}`).expect(200);

			const deleted: SchoolExternalTool | null = await em.findOne(SchoolExternalTool, {
				id: schoolExternalTool.id,
			});
			expect(deleted).toBeNull();
		});
	});

	describe('[GET] tools/school/', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, school } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);
			const params: SchoolExternalToolSearchParams = {
				schoolId: school.id,
			};

			await request(app.getHttpServer()).get(basePath).query(params).expect(403);
		});

		it('should return found schoolExternalTools for given school', async () => {
			const { adminUser, schoolExternalTool, externalTool2, school } = await setup();
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
									id: schoolExternalTool.id,
									name: externalTool2.name,
									schoolId: school.id,
									toolId: externalTool2.id,
									status: SchoolExternalToolStatusResponse.OUTDATED,
									toolVersion: schoolExternalTool.toolVersion,
									parameters: [
										{
											name: schoolExternalTool.schoolParameters[0].name,
											value: schoolExternalTool.schoolParameters[0].value,
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

	describe('[GET] tools/school/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, schoolExternalTool } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);

			await request(app.getHttpServer()).get(`${basePath}/${schoolExternalTool.id}`).expect(403);
		});

		it('should return found schoolExternalTool for given school', async () => {
			const { adminUser, schoolExternalTool, externalTool2, school } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);

			await request(app.getHttpServer())
				.get(`${basePath}/${schoolExternalTool.id}`)
				.expect(200)
				.then((res: Response) => {
					expect(res.body).toEqual(
						expect.objectContaining(<SchoolExternalToolResponse>{
							id: schoolExternalTool.id,
							name: '',
							schoolId: school.id,
							toolId: externalTool2.id,
							status: SchoolExternalToolStatusResponse.UNKNOWN,
							toolVersion: schoolExternalTool.toolVersion,
							parameters: [
								{
									name: schoolExternalTool.schoolParameters[0].name,
									value: schoolExternalTool.schoolParameters[0].value,
								},
							],
						})
					);
					return res;
				});
		});
	});

	describe('[PUT] tools/school/:schoolExternalToolId', () => {
		it('should return forbidden when user is not authorized', async () => {
			const { userWithMissingPermission, schoolExternalTool } = await setup();
			currentUser = mapUserToCurrentUser(userWithMissingPermission);
			const paramEntry = { name: 'name', value: 'Updatedvalue' };
			const randomTestId = new ObjectId().toString();
			const postParams: SchoolExternalToolPostParams = {
				toolId: randomTestId,
				schoolId: randomTestId,
				version: 1,
				parameters: [paramEntry],
			};

			await request(app.getHttpServer()).put(`${basePath}/${schoolExternalTool.id}`).send(postParams).expect(403);
		});
		it('should update an existing school external tool', async () => {
			const { externalTool, school, adminUser, schoolExternalTool } = await setup();
			currentUser = mapUserToCurrentUser(adminUser);
			const paramEntry = { name: 'name', value: 'Updatedvalue' };
			const postParams: SchoolExternalToolPostParams = {
				toolId: externalTool.id,
				schoolId: school.id,
				version: 1,
				parameters: [paramEntry],
			};
			await request(app.getHttpServer())
				.put(`${basePath}/${schoolExternalTool.id}`)
				.send(postParams)
				.expect(200)
				.then((res: Response) => {
					expect(res.body).toEqual(
						expect.objectContaining(<SchoolExternalToolResponse>{
							id: schoolExternalTool.id,
							name: externalTool.name,
							schoolId: postParams.schoolId,
							toolId: postParams.toolId,
							status: SchoolExternalToolStatusResponse.LATEST,
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
			const updatedSchoolExternalTool: SchoolExternalTool | null = await em.findOne(SchoolExternalTool, {
				school: postParams.schoolId,
				tool: postParams.toolId,
			});
			expect(updatedSchoolExternalTool).toBeDefined();
		});
	});
});
