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
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { ToolConfigurationListResponse } from '../dto';

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

	describe('[GET] tools/available/course/:id', () => {
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
				};
			};

			it('should return an array of available tools', async () => {
				const { user, course, externalTool } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const response: Response = await request(app.getHttpServer()).get(`/tools/available/course/${course.id}`);

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

				expect(response.body).toEqual<ToolConfigurationListResponse>({
					data: [],
				});
			});
		});
	});
});
