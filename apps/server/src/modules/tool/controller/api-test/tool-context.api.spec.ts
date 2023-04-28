import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalTool, Course, Permission, Role, RoleName, SchoolExternalTool, User } from '@shared/domain';
import {
	mapUserToCurrentUser,
	roleFactory,
	userFactory,
	schoolExternalToolFactory,
	courseFactory,
	contextExternalToolFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { ObjectId } from 'bson';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { ContextExternalToolPostParams, ContextExternalToolResponse } from '../dto';

import { ToolContextType } from '../../interface';

describe('ToolContextController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser;

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

				const teacherUser: User = userFactory.buildWithId({ roles: [teacherRole] });
				const userWithMissingPermission: User = userFactory.buildWithId();

				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser, userWithMissingPermission] });

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolParameters: [],
					toolVersion: 1,
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextId: course.id,
					parameters: [],
					toolVersion: 1,
				});

				em.persist([
					teacherRole,
					course,
					teacherUser,
					userWithMissingPermission,
					schoolExternalTool,
					contextExternalTool,
				]);
				await em.flush();
				em.clear();

				return {
					schoolExternalTool,
					contextExternalTool,
					course,
					teacherUser,
					userWithMissingPermission,
				};
			};

			it('should create an contextExternalTool', async () => {
				const { schoolExternalTool, course, teacherUser } = await setup();
				currentUser = mapUserToCurrentUser(teacherUser);

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalTool.id,
					contextId: course.id,
					contextType: ToolContextType.COURSE,
					parameters: [],
					toolVersion: 1,
				};

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
								contextType: 'course',
								parameters: [],
								toolVersion: postParams.toolVersion,
							})
						);
						return res;
					});

				const createdContextExternalTool: ContextExternalTool | null = await em.findOne(ContextExternalTool, {
					schoolTool: postParams.schoolToolId,
					contextId: postParams.contextId,
				});
				expect(createdContextExternalTool).toBeDefined();
			});
		});

		describe('when creation of contextExternalTool failed', () => {
			const setup = async () => {
				const teacherRole: Role = roleFactory.build({
					name: RoleName.TEACHER,
					permissions: [Permission.CONTEXT_TOOL_ADMIN],
				});

				const teacherUser: User = userFactory.buildWithId({ roles: [teacherRole] });
				const userWithMissingPermission: User = userFactory.buildWithId();

				const course: Course = courseFactory.buildWithId({ teachers: [teacherUser, userWithMissingPermission] });

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolParameters: [],
					toolVersion: 1,
				});

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextId: course.id,
					parameters: [],
					toolVersion: 1,
				});

				em.persist([
					teacherRole,
					course,
					teacherUser,
					userWithMissingPermission,
					schoolExternalTool,
					contextExternalTool,
				]);
				await em.flush();
				em.clear();

				return {
					schoolExternalTool,
					contextExternalTool,
					course,
					teacherUser,
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
});
