import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { accountFactory } from '@modules/account/testing';
import { BoardExternalReferenceType } from '@modules/board';
import { cardEntityFactory, columnBoardEntityFactory, columnEntityFactory } from '@modules/board/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { courseFactory } from '@testing/factory/course.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { userFactory } from '@testing/factory/user.factory';
import { TestApiClient } from '@testing/test-api-client';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	ToolContextType,
} from '../../../common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/repo';
import { contextExternalToolEntityFactory } from '../../../context-external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { customParameterFactory, externalToolEntityFactory, mediumEntityFactory } from '../../testing';
import {
	ContextExternalToolConfigurationTemplateListResponse,
	ContextExternalToolConfigurationTemplateResponse,
	PreferredToolListResponse,
	SchoolExternalToolConfigurationTemplateListResponse,
	SchoolExternalToolConfigurationTemplateResponse,
	ToolContextTypesListResponse,
} from '../dto';

describe('ToolConfigurationController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		orm = app.get(MikroORM);
		testApiClient = new TestApiClient(app, 'tools');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	describe('[GET] tools/:contextType/:contextId/available-tools', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				const course = courseFactory.buildWithId({ teachers: [studentUser], school });

				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();
				const externalTool = externalToolEntityFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
					contextId: course.id,
				});

				await em.persistAndFlush([
					school,
					course,
					studentUser,
					studentAccount,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(studentAccount);

				return {
					course,
					externalTool,
					schoolExternalTool,
					contextParameter,
					loggedInClient,
				};
			};

			it('should return a forbidden status', async () => {
				const { course, loggedInClient } = await setup();

				const response = await loggedInClient.get(`course/${course.id}/available-tools`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tools are available for a context', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseFactory.buildWithId({ teachers: [teacherUser], school });
				const board = columnBoardEntityFactory.build({
					context: { type: BoardExternalReferenceType.Course, id: course.id },
				});
				const columnNode = columnEntityFactory.withParent(board).build();
				const cardNode = cardEntityFactory.withParent(columnNode).build({ position: 0 });

				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();
				const externalTool = externalToolEntityFactory.buildWithId({
					restrictToContexts: [ToolContextType.COURSE],
					logoBase64: 'logo',
					parameters: [globalParameter, schoolParameter, contextParameter],
				});
				externalTool.logoUrl = `http://localhost:3030/api/v3/tools/external-tools/${externalTool.id}/logo`;

				const externalToolWithoutContextRestriction = externalToolEntityFactory.buildWithId({
					restrictToContexts: [],
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const schoolExternalTool2 = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalToolWithoutContextRestriction,
				});

				await em.persistAndFlush([
					school,
					course,
					board,
					columnNode,
					cardNode,
					teacherUser,
					teacherAccount,
					externalTool,
					externalToolWithoutContextRestriction,
					schoolExternalTool,
					schoolExternalTool2,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					course,
					board,
					externalTool,
					externalToolWithoutContextRestriction,
					schoolExternalTool,
					schoolExternalTool2,
					contextParameter,
					loggedInClient,
				};
			};

			it('should return an array of available tools with parameters of scope context', async () => {
				const {
					course,
					externalTool,
					externalToolWithoutContextRestriction,
					contextParameter,
					schoolExternalTool,
					schoolExternalTool2,
					loggedInClient,
				} = await setup();

				const response = await loggedInClient.get(`course/${course.id}/available-tools`);

				expect(response.body).toEqual<ContextExternalToolConfigurationTemplateListResponse>({
					data: [
						{
							externalToolId: externalTool.id,
							schoolExternalToolId: schoolExternalTool.id,
							name: externalTool.name,
							baseUrl: externalTool.config.baseUrl,
							logoUrl: externalTool.logoUrl,
							parameters: [
								{
									name: contextParameter.name,
									displayName: contextParameter.displayName,
									isOptional: contextParameter.isOptional,
									isProtected: contextParameter.isProtected,
									defaultValue: contextParameter.default,
									description: contextParameter.description,
									regex: contextParameter.regex,
									regexComment: contextParameter.regexComment,
									type: CustomParameterTypeParams.STRING,
									scope: CustomParameterScopeTypeParams.CONTEXT,
									location: CustomParameterLocationParams.BODY,
								},
							],
						},
						{
							externalToolId: externalToolWithoutContextRestriction.id,
							name: externalToolWithoutContextRestriction.name,
							baseUrl: externalToolWithoutContextRestriction.config.baseUrl,
							parameters: [],
							schoolExternalToolId: schoolExternalTool2.id,
						},
					],
				});
			});

			it('should not return the context restricted tool', async () => {
				const { board, loggedInClient, externalToolWithoutContextRestriction, schoolExternalTool2 } = await setup();

				const response = await loggedInClient.get(`board-element/${board.id}/available-tools`);

				expect(response.body).toEqual<ContextExternalToolConfigurationTemplateListResponse>({
					data: [
						{
							externalToolId: externalToolWithoutContextRestriction.id,
							name: externalToolWithoutContextRestriction.name,
							baseUrl: externalToolWithoutContextRestriction.config.baseUrl,
							parameters: [],
							schoolExternalToolId: schoolExternalTool2.id,
						},
					],
				});
			});
		});

		describe('when no tools are available for a course', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({}, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseFactory.buildWithId({ teachers: [teacherUser], school });

				const externalTool = externalToolEntityFactory.buildWithId();

				await em.persistAndFlush([teacherUser, school, course, teacherAccount, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					course,
				};
			};

			it('should return an empty array', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.get(`course/${course.id}/available-tools`);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateListResponse>({
					data: [],
				});
			});
		});
	});

	describe('[GET] tools/school/:schoolId/available-tools', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const user = userFactory.buildWithId({ school, roles: [] });
				const account = accountFactory.buildWithId({ userId: user.id });

				const course = courseFactory.buildWithId({ teachers: [user], school });

				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();
				const externalTool = externalToolEntityFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([user, account, course, school, externalTool, schoolExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(account);

				return {
					loggedInClient,
					school,
				};
			};

			it('should return a forbidden status', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.get(`school/${school.id}/available-tools`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tools are available for a school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);

				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();
				const externalTool = externalToolEntityFactory.buildWithId({
					logoBase64: 'logo',
					parameters: [globalParameter, schoolParameter, contextParameter],
				});
				externalTool.logoUrl = `http://localhost:3030/api/v3/tools/external-tools/${externalTool.id}/logo`;

				await em.persistAndFlush([adminUser, school, adminAccount, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					school,
					externalTool,
					schoolParameter,
				};
			};

			it('should return a list of available external tools with parameters of scope school', async () => {
				const { loggedInClient, school, externalTool, schoolParameter } = await setup();

				const response = await loggedInClient.get(`school/${school.id}/available-tools`);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateListResponse>({
					data: [
						{
							externalToolId: externalTool.id,
							name: externalTool.name,
							baseUrl: externalTool.config.baseUrl,
							logoUrl: externalTool.logoUrl,
							parameters: [
								{
									name: schoolParameter.name,
									displayName: schoolParameter.displayName,
									isOptional: schoolParameter.isOptional,
									isProtected: schoolParameter.isProtected,
									defaultValue: schoolParameter.default,
									description: schoolParameter.description,
									regex: schoolParameter.regex,
									regexComment: schoolParameter.regexComment,
									type: CustomParameterTypeParams.STRING,
									scope: CustomParameterScopeTypeParams.SCHOOL,
									location: CustomParameterLocationParams.BODY,
								},
							],
						},
					],
				});
			});
		});

		describe('when no tools are available for a school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.SCHOOL_TOOL_ADMIN]);

				await em.persistAndFlush([adminUser, school, adminAccount]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					school,
				};
			};

			it('should return an empty array', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.get(`school/${school.id}/available-tools`);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateListResponse>({
					data: [],
				});
			});
		});
	});

	describe('GET tools/school-external-tools/:schoolExternalToolId/configuration-template', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				// not on same school like the tool
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({}, []);
				const externalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([adminAccount, adminUser, school, externalTool, schoolExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					schoolExternalTool,
				};
			};

			it('should return a forbidden status', async () => {
				const { loggedInClient, schoolExternalTool } = await setup();

				const response = await loggedInClient.get(
					`school-external-tools/${schoolExternalTool.id}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tool is not hidden', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.SCHOOL_TOOL_ADMIN,
				]);

				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();
				const medium = mediumEntityFactory.build();
				const externalTool = externalToolEntityFactory.withMedium(medium).buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([adminUser, school, adminAccount, externalTool, schoolExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					school,
					externalTool,
					schoolParameter,
					schoolExternalTool,
					medium,
				};
			};

			it('should return a tool with parameter with scope school', async () => {
				const { loggedInClient, schoolExternalTool, externalTool, schoolParameter, medium } = await setup();

				const response = await loggedInClient.get(
					`school-external-tools/${schoolExternalTool.id}/configuration-template`
				);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateResponse>({
					externalToolId: externalTool.id,
					name: externalTool.name,
					baseUrl: externalTool.config.baseUrl,
					logoUrl: externalTool.logoUrl,
					parameters: [
						{
							name: schoolParameter.name,
							displayName: schoolParameter.displayName,
							isOptional: schoolParameter.isOptional,
							isProtected: schoolParameter.isProtected,
							defaultValue: schoolParameter.default,
							description: schoolParameter.description,
							regex: schoolParameter.regex,
							regexComment: schoolParameter.regexComment,
							type: CustomParameterTypeParams.STRING,
							scope: CustomParameterScopeTypeParams.SCHOOL,
							location: CustomParameterLocationParams.BODY,
						},
					],
					medium: {
						mediumId: medium.mediumId,
						mediaSourceId: medium.mediaSourceId,
						publisher: medium.publisher,
					},
				});
			});
		});

		describe('when tool is hidden', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.SCHOOL_TOOL_ADMIN]);

				const externalTool = externalToolEntityFactory.buildWithId({ isHidden: true });

				await em.persistAndFlush([adminUser, school, adminAccount, externalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					school,
					externalTool,
				};
			};

			it('should throw notFoundException', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(
					`school-external-tools/${new ObjectId().toHexString()}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('GET tools/context-external-tools/:contextExternalToolId/configuration-template', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({}, [Permission.SCHOOL_TOOL_ADMIN]);
				// user is not part of the course
				const course = courseFactory.build();
				const externalTool = externalToolEntityFactory.build();
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([course, adminUser, adminAccount, school, externalTool, schoolExternalTool]);

				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.build({
					schoolTool: schoolExternalTool,
					contextId: course.id,
				});

				await em.persistAndFlush([contextExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					contextExternalToolId: contextExternalTool.id,
				};
			};

			it('should return a forbidden status', async () => {
				const { loggedInClient, contextExternalToolId } = await setup();

				const response = await loggedInClient.get(
					`context-external-tools/${contextExternalToolId}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				// body
			});
		});

		describe('when tool is not hidden', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();
				const externalTool = externalToolEntityFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
					contextId: course.id,
				});

				await em.persistAndFlush([
					teacherUser,
					teacherAccount,
					school,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					course,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					externalTool,
					contextParameter,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return a tool with parameter with scope context', async () => {
				const { loggedInClient, externalTool, schoolExternalTool, contextParameter, contextExternalTool } =
					await setup();

				const response = await loggedInClient.get(
					`context-external-tools/${contextExternalTool.id}/configuration-template`
				);

				expect(response.body).toEqual<ContextExternalToolConfigurationTemplateResponse>({
					externalToolId: externalTool.id,
					schoolExternalToolId: schoolExternalTool.id,
					name: externalTool.name,
					baseUrl: externalTool.config.baseUrl,
					logoUrl: externalTool.logoUrl,
					parameters: [
						{
							name: contextParameter.name,
							displayName: contextParameter.displayName,
							isOptional: contextParameter.isOptional,
							isProtected: contextParameter.isProtected,
							defaultValue: contextParameter.default,
							description: contextParameter.description,
							regex: contextParameter.regex,
							regexComment: contextParameter.regexComment,
							type: CustomParameterTypeParams.STRING,
							scope: CustomParameterScopeTypeParams.CONTEXT,
							location: CustomParameterLocationParams.BODY,
						},
					],
				});
			});
		});

		describe('when tool is hidden', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);
				const course = courseFactory.build({ school, teachers: [teacherUser] });
				const externalTool = externalToolEntityFactory.build({ isHidden: true });
				const schoolExternalTool = schoolExternalToolEntityFactory.build({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([teacherUser, school, teacherAccount, externalTool, schoolExternalTool, course]);

				const contextExternalTool: ContextExternalToolEntity = contextExternalToolEntityFactory.build({
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
					contextId: course.id,
				});

				await em.persistAndFlush([contextExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					school,
					externalTool,
					contextExternalTool,
				};
			};

			it('should throw notFoundException', async () => {
				const { loggedInClient, contextExternalTool } = await setup();

				const response = await loggedInClient.get(
					`context-external-tools/${contextExternalTool.id}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('GET tools/context-types', () => {
		describe('when user is not authorized', () => {
			it('should return unauthorized status', async () => {
				const response = await testApiClient.get('context-types');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is authorized', () => {
			const setup = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({}, [Permission.TOOL_ADMIN]);

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				const contextTypeList: ToolContextTypesListResponse = new ToolContextTypesListResponse([
					ToolContextType.COURSE,
					ToolContextType.BOARD_ELEMENT,
					ToolContextType.MEDIA_BOARD,
				]);

				return { loggedInClient, contextTypeList };
			};

			it('should return all context types', async () => {
				const { loggedInClient, contextTypeList } = await setup();

				const response = await loggedInClient.get('context-types');

				expect(response.body).toEqual(contextTypeList);
			});
		});
	});

	describe('[GET] tools/preferred-tools', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();

				const externalTool = externalToolEntityFactory.buildWithId({
					isPreferred: true,
					iconName: 'iconName',
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([school, adminUser, adminAccount, externalTool, schoolExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return a unauthorized status', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`/preferred-tools`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when preferred tools are available for a context', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const externalTool = externalToolEntityFactory.buildWithId({
					restrictToContexts: [],
					isPreferred: true,
					iconName: 'iconName',
				});

				const externalToolWithContextRestriction = externalToolEntityFactory.buildWithId({
					restrictToContexts: [ToolContextType.COURSE],
					isPreferred: true,
					iconName: 'iconName',
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const schoolExternalTool2 = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalToolWithContextRestriction,
				});

				await em.persistAndFlush([
					school,
					teacherUser,
					teacherAccount,
					externalTool,
					externalToolWithContextRestriction,
					schoolExternalTool,
					schoolExternalTool2,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					externalTool,
					externalToolWithContextRestriction,
					schoolExternalTool,
					schoolExternalTool2,
					loggedInClient,
				};
			};

			it('should return an array of preferred tools', async () => {
				const {
					externalTool,
					externalToolWithContextRestriction,
					schoolExternalTool,
					schoolExternalTool2,
					loggedInClient,
				} = await setup();

				const response = await loggedInClient.get('/preferred-tools');

				expect(response.body).toEqual<PreferredToolListResponse>({
					data: [
						{
							schoolExternalToolId: schoolExternalTool.id,
							name: externalTool.name,
							iconName: 'iconName',
						},
						{
							schoolExternalToolId: schoolExternalTool2.id,
							name: externalToolWithContextRestriction.name,
							iconName: 'iconName',
						},
					],
				});
			});

			it('should not return the context restricted tool', async () => {
				const { loggedInClient, externalTool, schoolExternalTool } = await setup();

				const response = await loggedInClient.get('/preferred-tools').query({ contextType: 'board-element' });

				expect(response.body).toEqual<PreferredToolListResponse>({
					data: [
						{
							schoolExternalToolId: schoolExternalTool.id,
							name: externalTool.name,
							iconName: 'iconName',
						},
					],
				});
			});
		});

		describe('when no preferred tools are available', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({}, [
					Permission.CONTEXT_TOOL_ADMIN,
				]);

				const externalTool = externalToolEntityFactory.buildWithId({
					isPreferred: false,
				});

				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([teacherUser, school, teacherAccount, externalTool, schoolExternalTool]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
				};
			};

			it('should return an empty array', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('/preferred-tools');

				expect(response.body).toEqual<PreferredToolListResponse>({
					data: [],
				});
			});
		});
	});
});
