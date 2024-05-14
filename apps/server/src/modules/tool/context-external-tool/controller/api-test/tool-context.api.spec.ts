import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, SchoolEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	accountFactory,
	courseFactory,
	roleFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { ObjectId } from '@mikro-orm/mongodb';
import { CustomParameterScope, CustomParameterType, ToolContextType } from '../../../common/enum';
import { ExternalToolEntity } from '../../../external-tool/entity';
import { customParameterEntityFactory, externalToolEntityFactory } from '../../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../entity';
import { contextExternalToolEntityFactory } from '../../testing';
import {
	ContextExternalToolPostParams,
	ContextExternalToolResponse,
	ContextExternalToolSearchListResponse,
} from '../dto';

describe('ToolContextController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	const basePath = '/tools/context-external-tools';

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

	describe('[POST] tools/context-external-tools', () => {
		describe('when creation of contextExternalTool is successfully', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser], school });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [
						customParameterEntityFactory.build({
							name: 'param1',
							scope: CustomParameterScope.CONTEXT,
							type: CustomParameterType.STRING,
							isOptional: false,
						}),
						customParameterEntityFactory.build({
							name: 'param2',
							scope: CustomParameterScope.CONTEXT,
							type: CustomParameterType.BOOLEAN,
							isOptional: true,
						}),
					],
					restrictToContexts: [ToolContextType.COURSE],
					version: 1,
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
					toolVersion: 1,
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [
						{ name: 'param1', value: 'value' },
						{ name: 'param2', value: 'true' },
					],
					toolVersion: 1,
				};

				await em.persistAndFlush([teacherUser, teacherAccount, course, school, schoolExternalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					postParams,
				};
			};

			it('should create a contextExternalTool', async () => {
				const { postParams, loggedInClient } = await setup();

				const response = await loggedInClient.post().send(postParams);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual<ContextExternalToolResponse>({
					id: expect.any(String),
					schoolToolId: postParams.schoolToolId,
					contextId: postParams.contextId,
					displayName: postParams.displayName,
					contextType: postParams.contextType,
					parameters: [
						{ name: 'param1', value: 'value' },
						{ name: 'param2', value: 'true' },
					],
					toolVersion: postParams.toolVersion,
				});
			});
		});

		describe('when user is not authorized for the requested context', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const course = courseFactory.build({ teachers: [teacherUser] });
				const otherCourse = courseFactory.build();
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.build({
					schoolParameters: [],
					toolVersion: 1,
					school,
				});

				await em.persistAndFlush([course, otherCourse, school, teacherUser, teacherAccount, schoolExternalToolEntity]);
				em.clear();

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: otherCourse.id,
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				};

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					postParams,
				};
			};

			it('it should return forbidden', async () => {
				const { postParams, loggedInClient } = await setup();

				const response = await loggedInClient.post().send(postParams);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				// expected body is missed
			});
		});

		describe('when external tool has no restrictions ', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser], school });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [],
					restrictToContexts: [],
					version: 1,
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
					toolVersion: 1,
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				};

				await em.persistAndFlush([teacherUser, teacherAccount, course, school, schoolExternalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					postParams,
				};
			};

			it('should create tool', async () => {
				const { postParams, loggedInClient } = await setup();

				const response = await loggedInClient.post().send(postParams);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual<ContextExternalToolResponse>({
					id: expect.any(String),
					schoolToolId: postParams.schoolToolId,
					contextId: postParams.contextId,
					displayName: postParams.displayName,
					contextType: postParams.contextType,
					parameters: [],
					toolVersion: postParams.toolVersion,
				});
			});
		});

		describe('when external tool restricts to wrong context ', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser], school });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [],
					restrictToContexts: [ToolContextType.BOARD_ELEMENT],
					version: 1,
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
					toolVersion: 1,
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				};

				await em.persistAndFlush([teacherUser, teacherAccount, course, school, schoolExternalToolEntity]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					postParams,
				};
			};

			it('should return unprocessable entity', async () => {
				const { postParams, loggedInClient } = await setup();

				const response = await loggedInClient.post().send(postParams);

				expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});
	});

	describe('[DELETE] tools/context-external-tools/:contextExternalToolId', () => {
		describe('when deletion of contextExternalTool is successfully', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);
				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser] });

				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					toolVersion: 1,
					school,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalToolEntity,
					toolVersion: 1,
				});

				em.persist([course, teacherUser, teacherAccount, schoolExternalToolEntity, contextExternalToolEntity]);
				await em.flush();
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					contextExternalToolEntity,
				};
			};

			it('should delete an contextExternalTool', async () => {
				const { loggedInClient, contextExternalToolEntity } = await setup();

				const result = await loggedInClient.delete(`${contextExternalToolEntity.id}`);

				expect(result.statusCode).toEqual(HttpStatus.NO_CONTENT);

				const deleted: ContextExternalToolEntity | null = await em.findOne(ContextExternalToolEntity, {
					contextId: contextExternalToolEntity.id,
				});

				expect(deleted).toBeNull();
			});
		});

		describe('when deletion of contextExternalTool failed', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseFactory.buildWithId({ teachers: [teacherUser] });
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					toolVersion: 1,
				});
				const contextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					toolVersion: 1,
				});

				await em.persistAndFlush([
					course,
					teacherUser,
					teacherAccount,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					contextExternalToolEntity,
					loggedInClient,
				};
			};

			it('when user is not authorized, it should return forbidden', async () => {
				const { loggedInClient, contextExternalToolEntity } = await setup();

				const result = await loggedInClient.delete(`${contextExternalToolEntity.id}`);

				expect(result.statusCode).toEqual(HttpStatus.FORBIDDEN);
				// result.body is missed
			});
		});
	});

	describe('[GET] tools/context-external-tools/:contextType/:contextId', () => {
		const setup = async () => {
			const school: SchoolEntity = schoolEntityFactory.buildWithId();
			const otherSchool: SchoolEntity = schoolEntityFactory.buildWithId();

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
				Permission.CONTEXT_TOOL_ADMIN,
			]);
			const otherTeacherUser: User = userFactory.buildWithId({ roles: [], school: otherSchool });
			const otherTeacherAccount: AccountEntity = accountFactory.buildWithId({ userId: otherTeacherUser.id });

			const course: Course = courseFactory.buildWithId({
				students: [teacherUser],
				teachers: [teacherUser, otherTeacherUser],
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
				school,
				otherSchool,
				course,
				teacherUser,
				teacherAccount,
				otherTeacherUser,
				otherTeacherAccount,
				schoolExternalTool1,
				contextExternalTool1,
				schoolExternalTool2,
				contextExternalTool2,
				schoolExternalToolFromOtherSchool,
				contextExternalToolFromOtherSchool,
			]);
			await em.flush();
			em.clear();

			const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);
			const otherLoggedInClient: TestApiClient = await testApiClient.login(otherTeacherAccount);

			return {
				contextExternalTool1,
				contextExternalTool2,
				contextExternalToolFromOtherSchool,
				loggedInClient,
				otherLoggedInClient,
			};
		};

		describe('when user is authorized and has the required permissions', () => {
			it('should return context external tools he has permission for', async () => {
				const { contextExternalTool1, contextExternalTool2, loggedInClient, contextExternalToolFromOtherSchool } =
					await setup();

				const response = await loggedInClient.get(
					`${contextExternalTool1.contextType}/${contextExternalTool1.contextId}`
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
				expect(response.body).not.toEqual<ContextExternalToolSearchListResponse>({
					data: [
						{
							parameters: [
								{
									name: contextExternalToolFromOtherSchool.parameters[0].name,
									value: contextExternalToolFromOtherSchool.parameters[0].value,
								},
							],
							id: contextExternalToolFromOtherSchool.id,
							schoolToolId: contextExternalToolFromOtherSchool.schoolTool.id,
							contextId: contextExternalToolFromOtherSchool.contextId,
							contextType: ToolContextType.COURSE,
							displayName: contextExternalToolFromOtherSchool.displayName,
							toolVersion: contextExternalToolFromOtherSchool.toolVersion,
						},
					],
				});
			});

			describe('when user is not authorized', () => {
				it('should return unauthorized', async () => {
					const { contextExternalTool1 } = await setup();

					const response = await testApiClient.get(
						`${contextExternalTool1.contextType}/${contextExternalTool1.contextId}`
					);

					expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when user has not the required permission', () => {
				it('should return response with no tools', async () => {
					const { contextExternalTool1, otherLoggedInClient } = await setup();

					const response = await otherLoggedInClient.get(
						`${contextExternalTool1.contextType}/${contextExternalTool1.contextId}`
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
				const school: SchoolEntity = schoolEntityFactory.buildWithId();

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

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return tool in specific context', async () => {
				const { contextExternalTool, loggedInClient } = await setup();

				const response = await loggedInClient.get(`${contextExternalTool.id}`);

				expect(response.status).toEqual(HttpStatus.OK);
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
				const school: SchoolEntity = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course: Course = courseFactory.buildWithId({
					teachers: [teacherUser],
					school,
				});

				await em.persistAndFlush([school, course, teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return not found', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`${new ObjectId().toHexString()}`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not authorized', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();

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

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return unauthorized', async () => {
				const { contextExternalTool } = await setup();

				const response = await testApiClient.get(`${contextExternalTool.contextType}/${contextExternalTool.contextId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has not the required permission', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const course = courseFactory.build({
					teachers: [studentUser],
					school,
				});
				const externalTool: ExternalToolEntity = externalToolEntityFactory.build();
				const schoolExternalTool: SchoolExternalToolEntity = schoolExternalToolEntityFactory.build({
					school,
					tool: externalTool,
					toolVersion: 1,
				});

				await em.persistAndFlush([school, course, externalTool, schoolExternalTool, studentAccount, studentUser]);

				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.build({
					contextId: course.id,
					schoolTool: schoolExternalTool,
					toolVersion: 1,
					contextType: ContextExternalToolType.COURSE,
				});

				await em.persistAndFlush([contextExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

				return {
					contextExternalTool,
					schoolExternalTool,
					loggedInClient,
				};
			};

			it('should return forbidden', async () => {
				const { contextExternalTool, loggedInClient } = await setup();

				const response = await loggedInClient.get(`${contextExternalTool.id}`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				// body check
			});
		});
	});

	describe('[PUT] tools/context-external-tools/:contextExternalToolId', () => {
		describe('when update of contextExternalTool is successfully', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();

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

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					contextExternalToolEntity,
					course,
					teacherUser,
					postParams,
					loggedInClient,
				};
			};

			it('should update an contextExternalTool', async () => {
				const { contextExternalToolEntity, postParams, loggedInClient } = await setup();

				const response = await loggedInClient.put(`${contextExternalToolEntity.id}`).send(postParams);

				expect(response.status).toEqual(HttpStatus.OK);
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
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
				const roleWithoutPermission = roleFactory.build();
				teacherUser.roles.set([roleWithoutPermission]);

				const school = schoolEntityFactory.build();
				const course = courseFactory.build({ teachers: [teacherUser], school });
				const contextParameter = customParameterEntityFactory.build({
					scope: CustomParameterScope.CONTEXT,
					regex: 'testValue123',
				});
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.build({
					parameters: [contextParameter],
					version: 2,
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.build({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
					toolVersion: 2,
				});

				await em.persistAndFlush([
					course,
					school,
					teacherUser,
					teacherAccount,
					externalToolEntity,
					schoolExternalToolEntity,
				]);

				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.build({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'CoolTool123',
					parameters: [],
					toolVersion: 1,
				});

				await em.persistAndFlush([contextExternalToolEntity]);

				em.clear();

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

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, postParams, contextExternalToolEntity };
			};

			it('should return forbidden', async () => {
				const { loggedInClient, contextExternalToolEntity, postParams } = await setup();

				const response = await loggedInClient.put(`${contextExternalToolEntity.id}`).send(postParams);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				// body missed
			});
		});

		describe('when the user is not authenticated', () => {
			const setup = async () => {
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
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
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				return { contextExternalToolEntity, postParams };
			};

			it('should return unauthorized', async () => {
				const { contextExternalToolEntity, postParams } = await setup();

				const response = await testApiClient.put(`${contextExternalToolEntity.id}`).send(postParams);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
