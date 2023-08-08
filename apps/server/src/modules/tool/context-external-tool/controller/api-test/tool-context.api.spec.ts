import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Permission, Role, RoleName, School, User } from '@shared/domain';
import {
	contextExternalToolEntityFactory,
	courseFactory,
	customParameterEntityFactory,
	externalToolEntityFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolEntityFactory,
	schoolFactory,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser, JwtAuthGuard } from '@src/modules/authentication';
import { ServerTestModule } from '@src/modules/server';
import { ObjectId } from 'bson';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { CustomParameterScope, ToolContextType } from '../../../common/enum';
import { ExternalToolEntity } from '../../../external-tool/entity';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../entity';
import {
	ContextExternalToolPostParams,
	ContextExternalToolResponse,
	ContextExternalToolSearchListResponse,
} from '../dto';

describe('ToolContextController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser | undefined;

	const basePath = '/tools/context-external-tools';

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

	describe('[POST] tools/context-external-tools', () => {
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

	describe('[DELETE] tools/context-external-tools/:contextExternalToolId', () => {
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

	describe('[GET] tools/context-external-tools/:contextType/:contextId', () => {
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

	describe('[GET] tools/context-external-tools/:contextExternalToolId', () => {
		describe('when the tool exists', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({
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

				await em.persistAndFlush([
					school,
					course,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					teacherAccount,
					teacherUser,
				]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacherUser);

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return tool in specific context', async () => {
				const { contextExternalTool } = await setup();

				const response: Response = await request(app.getHttpServer()).get(`${basePath}/${contextExternalTool.id}`);

				expect(response.body).toEqual({
					schoolToolId: contextExternalTool.schoolTool.id,
					contextId: contextExternalTool.contextId,
					contextType: ToolContextType.COURSE,
					id: contextExternalTool.id,
					displayName: contextExternalTool.displayName,
					parameters: contextExternalTool.parameters,
					toolVersion: contextExternalTool.toolVersion,
				});
			});
		});

		describe('when the tool does not exist', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({
					teachers: [teacherUser],
					school,
				});

				await em.persistAndFlush([school, course, teacherAccount, teacherUser]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacherUser);
			};

			it('should return not found', async () => {
				await setup();

				const response: Response = await request(app.getHttpServer()).get(
					`${basePath}/${new ObjectId().toHexString()}`
				);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const course: Course = courseFactory.buildWithId({
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

				await em.persistAndFlush([school, course, externalTool, schoolExternalTool, contextExternalTool]);
				em.clear();

				currentUser = undefined;

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return unauthorized', async () => {
				const { contextExternalTool } = await setup();

				const response: Response = await request(app.getHttpServer()).get(
					`${basePath}/${contextExternalTool.contextType}/${contextExternalTool.contextId}`
				);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has not the required permission', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				const course: Course = courseFactory.buildWithId({
					teachers: [studentUser],
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

				await em.persistAndFlush([
					school,
					course,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					studentAccount,
					studentUser,
				]);
				em.clear();

				currentUser = mapUserToCurrentUser(studentUser);

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return forbidden', async () => {
				const { contextExternalTool } = await setup();

				const response: Response = await request(app.getHttpServer()).get(`${basePath}/${contextExternalTool.id}`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});
	});

	describe('[PUT] tools/context-external-tools/:contextExternalToolId', () => {
		describe('when update of contextExternalTool is successfully', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser], school });

				const contextParameter = customParameterEntityFactory.build({
					scope: CustomParameterScope.CONTEXT,
					regex: 'testValue123',
				});

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [contextParameter],
					version: 2,
				});

				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
					toolVersion: 2,
				});

				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'CoolTool123',
					parameters: [],
					toolVersion: 1,
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					contextType: ToolContextType.COURSE,
					displayName: 'CoolTool123',
					parameters: [
						{
							name: contextParameter.name,
							value: 'testValue123',
						},
					],
					toolVersion: 2,
				};

				await em.persistAndFlush([
					course,
					school,
					teacherUser,
					teacherAccount,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacherUser);

				return {
					contextExternalToolEntity,
					course,
					teacherUser,
					postParams,
				};
			};

			it('should update an contextExternalTool', async () => {
				const { contextExternalToolEntity, postParams } = await setup();

				const response = await request(app.getHttpServer())
					.put(`${basePath}/${contextExternalToolEntity.id}`)
					.send(postParams);

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should update an contextExternalTool', async () => {
				const { contextExternalToolEntity, postParams } = await setup();

				const response = await request(app.getHttpServer())
					.put(`${basePath}/${contextExternalToolEntity.id}`)
					.send(postParams);

				expect(response.body).toEqual({
					id: contextExternalToolEntity.id,
					schoolToolId: postParams.schoolToolId,
					contextId: postParams.contextId,
					displayName: postParams.displayName,
					contextType: postParams.contextType,
					parameters: postParams.parameters,
					toolVersion: postParams.toolVersion,
				});
			});
		});

		describe('when the user is not authorized', () => {
			const setup = async () => {
				const roleWithoutPermission = roleFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

				teacherUser.roles.set([roleWithoutPermission]);

				await em.persistAndFlush([teacherUser, teacherAccount]);
				em.clear();

				currentUser = mapUserToCurrentUser(teacherUser);
			};

			it('should return forbidden', async () => {
				await setup();

				const response = await request(app.getHttpServer()).put(`${basePath}/${new ObjectId().toString()}`).send({
					schoolToolId: new ObjectId().toString(),
					contextId: new ObjectId().toString(),
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				});

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is not authenticated', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return unauthorized', async () => {
				setup();

				const response = await request(app.getHttpServer()).put(`${basePath}/${new ObjectId().toHexString()}`).send({
					schoolToolId: new ObjectId().toHexString(),
					contextId: new ObjectId().toHexString(),
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
