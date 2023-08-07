import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Permission, Role, RoleName, School, User } from '@shared/domain';
import {
	contextExternalToolEntityFactory,
	courseFactory,
	externalToolEntityFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolEntityFactory,
	schoolFactory,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { ObjectId } from 'bson';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { ICurrentUser, JwtAuthGuard } from '@src/modules/authentication';
import { ServerTestModule } from '@src/modules/server';
import {
	ContextExternalToolPostParams,
	ContextExternalToolResponse,
	ContextExternalToolSearchListResponse,
} from '../dto';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { ToolContextType } from '../../../common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../entity';
import { ExternalToolEntity } from '../../../external-tool/entity';

describe('ToolContextController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser | undefined;

	const basePath = '/tools/context';

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

	describe('[POST] tools/context', () => {
		describe('when creation of contextExternalTool is successfully', () => {
			const setup = async () => {
				const teacherRole: Role = roleFactory.build({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();
				const teacher: User = userFactory.buildWithId({ roles: [teacherRole], school });

				const course: Course = courseFactory.buildWithId({ teachers: [teacher], school });

				const paramEntry = { name: 'name', value: 'value' };
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					school,
					schoolParameters: [paramEntry],
					toolVersion: 1,
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [paramEntry],
					toolVersion: 1,
				};

				await em.persistAndFlush([teacherRole, course, school, teacher, schoolExternalToolEntity]);
				em.clear();

				return {
					schoolExternalToolEntity,
					course,
					teacher,
					paramEntry,
					postParams,
				};
			};

			it('should create an contextExternalTool', async () => {
				const { teacher, postParams } = await setup();
				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer())
					.post(basePath)
					.send(postParams)
					.expect(201)
					.then((res: Response) => {
						expect(res.body).toEqual(
							expect.objectContaining(<ContextExternalToolResponse>{
								id: expect.any(String),
								schoolToolId: postParams.schoolToolId,
								contextId: postParams.contextId,
								displayName: postParams.displayName,
								contextType: postParams.contextType,
								parameters: postParams.parameters,
								toolVersion: postParams.toolVersion,
							})
						);
						return res;
					});

				const createdContextExternalTool: ContextExternalToolEntity | null = await em.findOne(
					ContextExternalToolEntity,
					{
						schoolTool: postParams.schoolToolId,
						contextId: postParams.contextId,
					}
				);

				expect(createdContextExternalTool).toBeDefined();
			});
		});

		describe('when creation of contextExternalTool failed', () => {
			const setup = async () => {
				const userWithMissingPermission: User = userFactory.buildWithId();

				const course: Course = courseFactory.buildWithId({ teachers: [userWithMissingPermission] });

				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					schoolParameters: [],
					toolVersion: 1,
				});

				await em.persistAndFlush([course, userWithMissingPermission, schoolExternalToolEntity]);
				em.clear();

				return {
					schoolExternalToolEntity,
					course,
					userWithMissingPermission,
				};
			};

			it('should return forbidden when user is not authorized', async () => {
				const { userWithMissingPermission } = await setup();
				currentUser = mapUserToCurrentUser(userWithMissingPermission);

				const randomTestId = new ObjectId().toString();
				const postParams: ContextExternalToolPostParams = {
					schoolToolId: randomTestId,
					contextId: randomTestId,
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				};

				await request(app.getHttpServer()).post(basePath).send(postParams).expect(403);
			});
		});
	});

	describe('[DELETE] tools/context/:contextExternalToolId', () => {
		describe('when deletion of contextExternalTool is successfully', () => {
			const setup = async () => {
				const teacherRole: Role = roleFactory.build({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();
				const teacher: User = userFactory.buildWithId({ roles: [teacherRole], school });

				const course: Course = courseFactory.buildWithId({ teachers: [teacher] });

				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					toolVersion: 1,
					school,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalToolEntity,
					toolVersion: 1,
				});

				em.persist([teacherRole, course, teacher, schoolExternalToolEntity, contextExternalToolEntity]);
				await em.flush();
				em.clear();

				return {
					contextExternalToolEntity,
					teacher,
				};
			};

			it('should delete an contextExternalTool', async () => {
				const { teacher, contextExternalToolEntity } = await setup();
				currentUser = mapUserToCurrentUser(teacher);

				await request(app.getHttpServer()).delete(`${basePath}/${contextExternalToolEntity.id}`).expect(200);

				const deleted: ContextExternalToolEntity | null = await em.findOne(ContextExternalToolEntity, {
					contextId: contextExternalToolEntity.id,
				});

				expect(deleted).toBeNull();
			});
		});

		describe('when deletion of contextExternalTool failed', () => {
			const setup = async () => {
				const userWithMissingPermission: User = userFactory.buildWithId();

				const course: Course = courseFactory.buildWithId({ teachers: [userWithMissingPermission] });

				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					toolVersion: 1,
				});

				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					toolVersion: 1,
				});

				em.persist([course, userWithMissingPermission, schoolExternalToolEntity, contextExternalToolEntity]);
				await em.flush();
				em.clear();

				return {
					contextExternalToolEntity,
					userWithMissingPermission,
				};
			};

			it('should return forbidden when user is not authorized', async () => {
				const { userWithMissingPermission, contextExternalToolEntity } = await setup();
				currentUser = mapUserToCurrentUser(userWithMissingPermission);

				await request(app.getHttpServer()).delete(`${basePath}/${contextExternalToolEntity.id}`).expect(403);
			});
		});
	});

	describe('[GET] tools/context/:contextType/:contextId', () => {
		const setup = async () => {
			const userRole: Role = roleFactory.build({
				name: RoleName.USER,
				permissions: [Permission.CONTEXT_TOOL_ADMIN],
			});

			const school: School = schoolFactory.buildWithId();
			const otherSchool: School = schoolFactory.buildWithId();

			const user: User = userFactory.buildWithId({ roles: [userRole], school });
			const userFromOtherSchool: User = userFactory.buildWithId({ roles: [userRole], school: otherSchool });

			const course: Course = courseFactory.buildWithId({
				students: [user],
				teachers: [user, userFromOtherSchool],
				school,
			});

			const schoolExternalTool1: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				school,
				toolVersion: 1,
			});
			const contextExternalTool1: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				contextId: course.id,
				schoolTool: schoolExternalTool1,
				toolVersion: 1,
			});

			const schoolExternalTool2: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				toolVersion: 1,
				school,
			});
			const contextExternalTool2: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				contextId: course.id,
				schoolTool: schoolExternalTool2,
				toolVersion: 1,
			});

			const schoolExternalToolFromOtherSchool: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				school: otherSchool,
				toolVersion: 1,
			});
			const contextExternalToolFromOtherSchool: ContextExternalToolEntity =
				contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalToolFromOtherSchool,
					toolVersion: 1,
				});

			em.persist([
				userRole,
				school,
				otherSchool,
				course,
				user,
				userFromOtherSchool,
				schoolExternalTool1,
				contextExternalTool1,
				schoolExternalTool2,
				contextExternalTool2,
				schoolExternalToolFromOtherSchool,
				contextExternalToolFromOtherSchool,
			]);
			await em.flush();
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			return {
				contextExternalTool1,
				contextExternalTool2,
				user,
				userRole,
			};
		};

		describe('when user is authorized and has the required permissions', () => {
			it('should return context external tools he has permission for', async () => {
				const { contextExternalTool1, contextExternalTool2 } = await setup();

				const response: Response = await request(app.getHttpServer()).get(
					`${basePath}/${contextExternalTool1.contextType}/${contextExternalTool1.contextId}`
				);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ContextExternalToolSearchListResponse>({
					data: [
						{
							parameters: [
								{
									name: contextExternalTool1.parameters[0].name,
									value: contextExternalTool1.parameters[0].value,
								},
							],
							id: contextExternalTool1.id,
							schoolToolId: contextExternalTool1.schoolTool.id,
							contextId: contextExternalTool1.contextId,
							contextType: ToolContextType.COURSE,
							displayName: contextExternalTool1.displayName,
							toolVersion: contextExternalTool1.toolVersion,
						},
						{
							parameters: [
								{
									name: contextExternalTool2.parameters[0].name,
									value: contextExternalTool2.parameters[0].value,
								},
							],
							id: contextExternalTool2.id,
							schoolToolId: contextExternalTool2.schoolTool.id,
							contextId: contextExternalTool2.contextId,
							contextType: ToolContextType.COURSE,
							displayName: contextExternalTool2.displayName,
							toolVersion: contextExternalTool2.toolVersion,
						},
					],
				});
			});

			describe('when user is not authorized', () => {
				it('should return unauthorized', async () => {
					const { contextExternalTool1 } = await setup();
					currentUser = undefined;

					await request(app.getHttpServer())
						.get(`${basePath}/${contextExternalTool1.contextType}/${contextExternalTool1.contextId}`)
						.expect(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when user has not the required permission', () => {
				it('should return response with no tools', async () => {
					const { contextExternalTool1, userRole } = await setup();
					userRole.permissions = [];
					await em.persistAndFlush(userRole);

					const response: Response = await request(app.getHttpServer()).get(
						`${basePath}/${contextExternalTool1.contextType}/${contextExternalTool1.contextId}`
					);

					expect(response.status).toEqual(HttpStatus.OK);
					expect(response.body).toEqual<ContextExternalToolSearchListResponse>({
						data: [],
					});
				});
			});
		});
	});

	describe('[GET] tools/context/:contextType/:contextId/configuration', () => {
		const setup = async () => {
			const userRole: Role = roleFactory.build({
				name: RoleName.TEACHER,
				permissions: [Permission.CONTEXT_TOOL_ADMIN],
			});

			const school: School = schoolFactory.buildWithId();

			const user: User = userFactory.buildWithId({ roles: [userRole], school });

			const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
				Permission.CONTEXT_TOOL_ADMIN,
			]);
			const course: Course = courseFactory.buildWithId({
				students: [user],
				teachers: [teacherUser],
				school,
			});
			const externalTool: ExternalToolEntity = externalToolEntityFactory.buildWithId();

			const schoolExternalTool: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				school,
				tool: externalTool,
				toolVersion: 1,
			});
			const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				contextId: course.id,
				schoolTool: schoolExternalTool,
				toolVersion: 1,
				contextType: ContextExternalToolType.COURSE,
			});

			const contextExternalToolId = contextExternalTool._id;

			em.persist([
				userRole,
				school,
				course,
				user,
				schoolExternalTool,
				contextExternalTool,
				teacherAccount,
				teacherUser,
			]);
			await em.flush();
			em.clear();

			currentUser = mapUserToCurrentUser(teacherUser);

			return {
				contextExternalTool,
				currentUser,
				schoolExternalTool,
				contextExternalToolId,
			};
		};

		describe('when contextExternalToolId, contextType and contextId is given', () => {
			it('should return tool in specific context', async () => {
				const { contextExternalTool, schoolExternalTool, contextExternalToolId } = await setup();

				const response: Response = await request(app.getHttpServer()).get(
					`${basePath}/course/${contextExternalTool.contextId}/${contextExternalTool.id}/configuration`
				);

				expect(response.body).toEqual({
					schoolToolId: schoolExternalTool.id,
					contextId: contextExternalTool.contextId,
					contextType: ToolContextType.COURSE,
					id: contextExternalTool.id,
					displayName: contextExternalTool.displayName,
					parameters: contextExternalTool.parameters,
					toolVersion: contextExternalTool.toolVersion,
				});
			});
		});
	});
});
