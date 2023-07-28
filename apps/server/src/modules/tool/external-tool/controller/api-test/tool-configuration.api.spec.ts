import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContextExternalTool,
	ContextExternalToolType,
	Course,
	ExternalTool,
	Permission,
	Role,
	RoleName,
	School,
	SchoolExternalTool,
	User,
} from '@shared/domain';
import {
	contextExternalToolFactory,
	courseFactory,
	customParameterDOFactory,
	externalToolFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser, JwtAuthGuard } from '@src/modules/authentication';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
} from '../../../common/interface';
import {
	ContextExternalToolConfigurationTemplateListResponse,
	ContextExternalToolConfigurationTemplateResponse,
	SchoolExternalToolConfigurationTemplateListResponse,
	SchoolExternalToolConfigurationTemplateResponse,
} from '../dto';

describe('ToolSchoolController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser;

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

	describe('[GET] tools/:contextType/:contextId/available-tools', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [] });

				const course: Course = courseFactory.buildWithId({ teachers: [user], school });

				await em.persistAndFlush([user, school, course]);
				em.clear();

				return {
					user,
					school,
					course,
				};
			};

			it('should return a forbidden status', async () => {
				const { user, course } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/course/${course.id}/available-tools`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tools are available for a course', () => {
			const setup = async () => {
				const adminRole: Role = roleFactory.buildWithId({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				const course: Course = courseFactory.buildWithId({ teachers: [user], school });

				const [globalParameter, schoolParameter, contextParameter] = customParameterDOFactory.buildListWithEachType();
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([user, school, course, adminRole, externalTool, schoolExternalTool]);
				em.clear();

				return {
					user,
					school,
					course,
					externalTool,
					schoolExternalTool,
					contextParameter,
				};
			};

			it('should return an array of available tools with parameters of scope context', async () => {
				const { user, course, externalTool, contextParameter, schoolExternalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/course/${course.id}/available-tools`);

				expect(response.body).toEqual<ContextExternalToolConfigurationTemplateListResponse>({
					data: [
						{
							externalToolId: externalTool.id,
							schoolExternalToolId: schoolExternalTool.id,
							name: externalTool.name,
							logoUrl: externalTool.logoUrl,
							parameters: [
								{
									name: contextParameter.name,
									displayName: contextParameter.displayName,
									isOptional: contextParameter.isOptional,
									defaultValue: contextParameter.default,
									description: contextParameter.description,
									regex: contextParameter.regex,
									regexComment: contextParameter.regexComment,
									type: CustomParameterTypeParams.STRING,
									scope: CustomParameterScopeTypeParams.CONTEXT,
									location: CustomParameterLocationParams.BODY,
								},
							],
							version: externalTool.version,
						},
					],
				});
			});
		});

		describe('when no tools are available for a course', () => {
			const setup = async () => {
				const adminRole: Role = roleFactory.buildWithId({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				const course: Course = courseFactory.buildWithId({ teachers: [user], school });

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				await em.persistAndFlush([user, school, course, adminRole, externalTool]);
				em.clear();

				return {
					user,
					school,
					course,
					externalTool,
				};
			};

			it('should return an empty array', async () => {
				const { user, course } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/course/${course.id}/available-tools`);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateListResponse>({
					data: [],
				});
			});
		});
	});

	describe('[GET] tools/school/:schoolId/available-tools', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [] });

				await em.persistAndFlush([user, school]);
				em.clear();

				return {
					user,
					school,
				};
			};

			it('should return a forbidden status', async () => {
				const { user, school } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/school/${school.id}/available-tools`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tools are available for a school', () => {
			const setup = async () => {
				const adminRole: Role = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.SCHOOL_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				const [globalParameter, schoolParameter, contextParameter] = customParameterDOFactory.buildListWithEachType();
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				await em.persistAndFlush([user, school, adminRole, externalTool]);
				em.clear();

				return {
					user,
					school,
					externalTool,
					schoolParameter,
				};
			};

			it('should return a list of available external tools with parameters of scope school', async () => {
				const { user, school, externalTool, schoolParameter } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/school/${school.id}/available-tools`);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateListResponse>({
					data: [
						{
							externalToolId: externalTool.id,
							name: externalTool.name,
							logoUrl: externalTool.logoUrl,
							parameters: [
								{
									name: schoolParameter.name,
									displayName: schoolParameter.displayName,
									isOptional: schoolParameter.isOptional,
									defaultValue: schoolParameter.default,
									description: schoolParameter.description,
									regex: schoolParameter.regex,
									regexComment: schoolParameter.regexComment,
									type: CustomParameterTypeParams.STRING,
									scope: CustomParameterScopeTypeParams.SCHOOL,
									location: CustomParameterLocationParams.BODY,
								},
							],
							version: externalTool.version,
						},
					],
				});
			});
		});

		describe('when no tools are available for a school', () => {
			const setup = async () => {
				const adminRole: Role = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.SCHOOL_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([user, school, adminRole]);
				em.clear();

				return {
					user,
					school,
				};
			};

			it('should return an empty array', async () => {
				const { user, school } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/school/${school.id}/available-tools`);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateListResponse>({
					data: [],
				});
			});
		});
	});

	describe('GET tools/school-external-tools/:schoolExternalToolId/configuration-template', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([user, school, externalTool, schoolExternalTool]);
				em.clear();

				return {
					user,
					schoolExternalTool,
				};
			};

			it('should return a forbidden status', async () => {
				const { user, schoolExternalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/school-external-tools/${schoolExternalTool.id}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tool is not hidden', () => {
			const setup = async () => {
				const adminRole: Role = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.SCHOOL_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				const [globalParameter, schoolParameter, contextParameter] = customParameterDOFactory.buildListWithEachType();
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});

				await em.persistAndFlush([user, school, adminRole, externalTool, schoolExternalTool]);
				em.clear();

				return {
					user,
					school,
					externalTool,
					schoolParameter,
					schoolExternalTool,
				};
			};

			it('should return a tool with parameter with scope school', async () => {
				const { user, schoolExternalTool, externalTool, schoolParameter } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/school-external-tools/${schoolExternalTool.id}/configuration-template`
				);

				expect(response.body).toEqual<SchoolExternalToolConfigurationTemplateResponse>({
					externalToolId: externalTool.id,
					name: externalTool.name,
					logoUrl: externalTool.logoUrl,
					version: externalTool.version,
					parameters: [
						{
							name: schoolParameter.name,
							displayName: schoolParameter.displayName,
							isOptional: schoolParameter.isOptional,
							defaultValue: schoolParameter.default,
							description: schoolParameter.description,
							regex: schoolParameter.regex,
							regexComment: schoolParameter.regexComment,
							type: CustomParameterTypeParams.STRING,
							scope: CustomParameterScopeTypeParams.SCHOOL,
							location: CustomParameterLocationParams.BODY,
						},
					],
				});
			});
		});

		describe('when tool is hidden', () => {
			const setup = async () => {
				const adminRole: Role = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.SCHOOL_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: true });

				await em.persistAndFlush([user, school, adminRole, externalTool]);
				em.clear();

				return {
					user,
					school,
					externalTool,
				};
			};

			it('should throw notFoundException', async () => {
				const { user } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/school-external-tools/${new ObjectId().toHexString()}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('GET tools/context-external-tools/:contextExternalToolId/configuration-template', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const course: Course = courseFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
				});

				await em.persistAndFlush([user, school, externalTool, schoolExternalTool, contextExternalTool, course]);
				em.clear();

				return {
					user,
					contextExternalTool,
				};
			};

			it('should return a forbidden status', async () => {
				const { user, contextExternalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/context-external-tools/${contextExternalTool.id}/configuration-template`
				);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when tool is not hidden', () => {
			const setup = async () => {
				const teacherRole: Role = roleFactory.buildWithId({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const course: Course = courseFactory.buildWithId({ school, teachers: [user] });

				const [globalParameter, schoolParameter, contextParameter] = customParameterDOFactory.buildListWithEachType();
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
					contextId: course.id,
				});

				await em.persistAndFlush([user, school, externalTool, schoolExternalTool, contextExternalTool, course]);
				em.clear();

				return {
					user,
					school,
					course,
					externalTool,
					contextParameter,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return a tool with parameter with scope context', async () => {
				const { user, externalTool, schoolExternalTool, contextParameter, contextExternalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/context-external-tools/${contextExternalTool.id}/configuration-template`
				);

				expect(response.body).toEqual<ContextExternalToolConfigurationTemplateResponse>({
					externalToolId: externalTool.id,
					schoolExternalToolId: schoolExternalTool.id,
					name: externalTool.name,
					logoUrl: externalTool.logoUrl,
					version: externalTool.version,
					parameters: [
						{
							name: contextParameter.name,
							displayName: contextParameter.displayName,
							isOptional: contextParameter.isOptional,
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
				const teacherRole: Role = roleFactory.buildWithId({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const course: Course = courseFactory.buildWithId({ school, teachers: [user] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: true });

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					school,
					tool: externalTool,
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextType: ContextExternalToolType.COURSE,
					contextId: course.id,
				});

				await em.persistAndFlush([
					user,
					school,
					teacherRole,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					course,
				]);
				em.clear();

				return {
					user,
					school,
					externalTool,
					contextExternalTool,
				};
			};

			it('should throw notFoundException', async () => {
				const { user, contextExternalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/context-external-tools/${contextExternalTool.id}/configuration-template`
				);
				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});
