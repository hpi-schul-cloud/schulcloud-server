import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { courseEntityFactory } from '@modules/course/testing';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { CustomParameterScope, CustomParameterType, ToolContextType } from '../../../common/enum';
import { customParameterEntityFactory, externalToolEntityFactory } from '../../../external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../repo';
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
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser], school });

				const externalToolEntity = externalToolEntityFactory.buildWithId({
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
				});
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
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
				};

				await em.persist([teacherUser, teacherAccount, course, school, schoolExternalToolEntity]).flush();
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
				});
			});
		});

		describe('when user is not authorized for the requested context', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const course = courseEntityFactory.build({ teachers: [teacherUser] });
				const otherCourse = courseEntityFactory.build();
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.build({
					schoolParameters: [],
					school,
				});

				await em.persist([course, otherCourse, school, teacherUser, teacherAccount, schoolExternalToolEntity]).flush();
				em.clear();

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: otherCourse.id,
					contextType: ToolContextType.COURSE,
					parameters: [],
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
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser], school });

				const externalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [],
					restrictToContexts: [],
				});
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [],
				};

				await em.persist([teacherUser, teacherAccount, course, school, schoolExternalToolEntity]).flush();
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
				});
			});
		});

		describe('when external tool restricts to wrong context ', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser], school });

				const externalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [],
					restrictToContexts: [ToolContextType.BOARD_ELEMENT],
				});
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [],
				};

				await em.persist([teacherUser, teacherAccount, course, school, schoolExternalToolEntity]).flush();
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
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);
				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser] });

				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					school,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalToolEntity,
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
					contextId: new ObjectId(contextExternalToolEntity.id),
				});

				expect(deleted).toBeNull();
			});
		});

		describe('when deletion of contextExternalTool failed', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser] });
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({});
				const contextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
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
			const school = schoolEntityFactory.buildWithId();
			const otherSchool = schoolEntityFactory.buildWithId();

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
				Permission.CONTEXT_TOOL_ADMIN,
			]);
			const otherTeacherUser = userFactory.buildWithId({ roles: [], school: otherSchool });
			const otherTeacherAccount = accountFactory.buildWithId({ userId: otherTeacherUser.id });

			const course = courseEntityFactory.buildWithId({
				students: [teacherUser],
				teachers: [teacherUser, otherTeacherUser],
				school,
			});

			const schoolExternalTool1 = schoolExternalToolEntityFactory.buildWithId({
				school,
			});
			const contextExternalTool1: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				contextId: course.id,
				schoolTool: schoolExternalTool1,
			});

			const schoolExternalTool2 = schoolExternalToolEntityFactory.buildWithId({
				school,
			});
			const contextExternalTool2: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				contextId: course.id,
				schoolTool: schoolExternalTool2,
			});

			const schoolExternalToolFromOtherSchool = schoolExternalToolEntityFactory.buildWithId({
				school: otherSchool,
			});
			const contextExternalToolFromOtherSchool: ContextExternalToolEntity =
				contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalToolFromOtherSchool,
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
					`${contextExternalTool1.contextType}/${contextExternalTool1.contextId.toHexString()}`
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
							contextId: contextExternalTool1.contextId.toHexString(),
							contextType: ToolContextType.COURSE,
							displayName: contextExternalTool1.displayName,
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
							contextId: contextExternalTool2.contextId.toHexString(),
							contextType: ToolContextType.COURSE,
							displayName: contextExternalTool2.displayName,
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
							contextId: contextExternalToolFromOtherSchool.contextId.toHexString(),
							contextType: ToolContextType.COURSE,
							displayName: contextExternalToolFromOtherSchool.displayName,
						},
					],
				});
			});

			describe('when user is not authorized', () => {
				it('should return unauthorized', async () => {
					const { contextExternalTool1 } = await setup();

					const response = await testApiClient.get(
						`${contextExternalTool1.contextType}/${contextExternalTool1.contextId.toHexString()}`
					);

					expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when user has not the required permission', () => {
				it('should return response with no tools', async () => {
					const { contextExternalTool1, otherLoggedInClient } = await setup();

					const response = await otherLoggedInClient.get(
						`${contextExternalTool1.contextType}/${contextExternalTool1.contextId.toHexString()}`
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
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseEntityFactory.buildWithId({
					teachers: [teacherUser],
					school,
				});

				const externalTool = externalToolEntityFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});
				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalTool,
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
					contextId: contextExternalTool.contextId.toHexString(),
					contextType: ToolContextType.COURSE,
					id: contextExternalTool.id,
					displayName: contextExternalTool.displayName,
					parameters: contextExternalTool.parameters,
				});
			});
		});

		describe('when the tool does not exist', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseEntityFactory.buildWithId({
					teachers: [teacherUser],
					school,
				});

				await em.persist([school, course, teacherAccount, teacherUser]).flush();
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
				const school = schoolEntityFactory.buildWithId();

				const course = courseEntityFactory.buildWithId({
					school,
				});

				const externalTool = externalToolEntityFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});
				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					contextId: course.id,
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
				});

				await em.persist([school, course, externalTool, schoolExternalTool, contextExternalTool]).flush();
				em.clear();

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return unauthorized', async () => {
				const { contextExternalTool } = await setup();

				const response = await testApiClient.get(
					`${contextExternalTool.contextType}/${contextExternalTool.contextId.toHexString()}`
				);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has not the required permission', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
				const course = courseEntityFactory.build({
					teachers: [studentUser],
					school,
				});
				const externalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					school,
					tool: externalTool,
				});

				await em.persist([school, course, externalTool, schoolExternalTool, studentAccount, studentUser]).flush();

				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.build({
					contextId: course.id,
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
				});

				await em.persist([contextExternalTool]).flush();
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
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser], school });

				const contextParameter = customParameterEntityFactory.build({
					scope: CustomParameterScope.CONTEXT,
					regex: 'testValue123',
				});

				const externalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [contextParameter],
				});

				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
				});

				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'CoolTool123',
					parameters: [],
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
				});
			});
		});

		describe('when the user is not authorized', () => {
			const setup = async () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
				const roleWithoutPermission = roleFactory.build();
				teacherUser.roles.set([roleWithoutPermission]);

				const school = schoolEntityFactory.build();
				const course = courseEntityFactory.build({ teachers: [teacherUser], school });
				const contextParameter = customParameterEntityFactory.build({
					scope: CustomParameterScope.CONTEXT,
					regex: 'testValue123',
				});
				const externalToolEntity = externalToolEntityFactory.build({
					parameters: [contextParameter],
				});
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.build({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
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
				});

				await em.persist([contextExternalToolEntity]).flush();

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
				const school = schoolEntityFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser], school });

				const contextParameter = customParameterEntityFactory.build({
					scope: CustomParameterScope.CONTEXT,
					regex: 'testValue123',
				});

				const externalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [contextParameter],
				});

				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
				});

				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'CoolTool123',
					parameters: [],
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
