import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, ExternalTool, Permission, Role, RoleName, School, SchoolExternalTool, User } from '@shared/domain';
import {
	courseFactory,
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
import { CustomParameterResponse, SchoolToolConfigurationListResponse, ToolConfigurationListResponse } from '../dto';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
} from '../../interface';

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

	describe('[GET] tools/available/context/:id', () => {
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

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/course/${course.id}`);

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

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

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
				};
			};

			it('should return an array of available tools', async () => {
				const { user, course, externalTool, schoolExternalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/course/${course.id}`);

				expect(response.body).toEqual<SchoolToolConfigurationListResponse>({
					data: [
						{
							id: externalTool.id,
							name: externalTool.name,
							logoUrl: externalTool.logoUrl,
							schoolToolId: schoolExternalTool.id,
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

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/course/${course.id}`);

				expect(response.body).toEqual<SchoolToolConfigurationListResponse>({
					data: [],
				});
			});
		});
	});

	describe('[GET] tools/available/school/:id', () => {
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

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/school/${school.id}`);

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

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				await em.persistAndFlush([user, school, adminRole, externalTool]);
				em.clear();

				return {
					user,
					school,
					externalTool,
				};
			};

			it('should return a list of available external tools', async () => {
				const { user, school, externalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/school/${school.id}`);

				expect(response.body).toEqual<ToolConfigurationListResponse>({
					data: [
						{
							id: externalTool.id,
							name: externalTool.name,
							logoUrl: externalTool.logoUrl,
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

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/school/${school.id}`);

				expect(response.body).toEqual<ToolConfigurationListResponse>({
					data: [],
				});
			});
		});
	});

	describe('GET tools/:toolId/configuration', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				await em.persistAndFlush([user, school, externalTool]);
				em.clear();

				return {
					user,
					externalTool,
				};
			};

			it('should return a forbidden status', async () => {
				const { user, externalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/${externalTool.id}/configuration`);

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

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const customParameterResponse: CustomParameterResponse[] = [
					{
						name: 'name',
						displayName: 'User Friendly Name',
						description: 'This is a mock parameter.',
						defaultValue: 'default',
						location: CustomParameterLocationParams.PATH,
						scope: CustomParameterScopeTypeParams.SCHOOL,
						type: CustomParameterTypeParams.STRING,
						regex: 'regex',
						regexComment: 'mockComment',
						isOptional: false,
					},
				];

				await em.persistAndFlush([user, school, adminRole, externalTool]);
				em.clear();

				return {
					user,
					school,
					externalTool,
					customParameterResponse,
				};
			};

			it('should return a tool', async () => {
				const { user, externalTool, customParameterResponse } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/${externalTool.id}/configuration`);

				expect(response.body).toEqual({
					id: externalTool.id,
					name: externalTool.name,
					logoUrl: externalTool.logoUrl,
					version: externalTool.version,
					parameters: customParameterResponse,
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
				const { user, externalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/${externalTool.id}/configuration`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('GET tools/:toolId/:context/:id/configuration', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const school: School = schoolFactory.buildWithId();

				const course: Course = courseFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				await em.persistAndFlush([user, school, externalTool, course]);
				em.clear();

				return {
					user,
					externalTool,
					course,
				};
			};

			it('should return a forbidden status', async () => {
				const { user, externalTool, course } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/${externalTool.id}/course/${course.id}/configuration`
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

				const course: Course = courseFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const customParameterResponse: CustomParameterResponse[] = [
					{
						name: 'name',
						displayName: 'User Friendly Name',
						description: 'This is a mock parameter.',
						defaultValue: 'default',
						location: CustomParameterLocationParams.PATH,
						scope: CustomParameterScopeTypeParams.CONTEXT,
						type: CustomParameterTypeParams.STRING,
						regex: 'regex',
						regexComment: 'mockComment',
						isOptional: false,
					},
				];

				await em.persistAndFlush([user, school, teacherRole, externalTool, course]);
				em.clear();

				return {
					user,
					school,
					course,
					externalTool,
					customParameterResponse,
				};
			};

			it('should return a tool', async () => {
				const { user, externalTool, customParameterResponse, course } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/${externalTool.id}/course/${course.id}/configuration`
				);

				expect(response.body).toEqual({
					id: externalTool.id,
					name: externalTool.name,
					logoUrl: externalTool.logoUrl,
					version: externalTool.version,
					parameters: customParameterResponse,
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

				const course: Course = courseFactory.buildWithId();

				const user: User = userFactory.buildWithId({ school, roles: [teacherRole] });

				const externalTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: true });

				await em.persistAndFlush([user, school, teacherRole, externalTool, course]);
				em.clear();

				return {
					user,
					school,
					externalTool,
					course,
				};
			};

			it('should throw notFoundException', async () => {
				const { user, externalTool, course } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(
					`/tools/${externalTool.id}/course/${course.id}/configuration`
				);
				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});
