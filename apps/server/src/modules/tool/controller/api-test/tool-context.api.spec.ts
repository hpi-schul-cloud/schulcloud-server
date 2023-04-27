import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContextExternalTool,
	Course,
	Permission,
	Role,
	RoleName,
	School,
	SchoolExternalTool,
	User,
} from '@shared/domain';
import {
	mapUserToCurrentUser,
	roleFactory,
	userFactory,
	schoolFactory,
	schoolExternalToolFactory,
	courseFactory,
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

	const setup = async () => {
		const teacherRole: Role = roleFactory.build({
			name: RoleName.TEACHER,
			permissions: [Permission.CONTEXT_TOOL_ADMIN],
		});
		const school: School = schoolFactory.buildWithId();

		const teacherUser: User = userFactory.buildWithId({ school, roles: [teacherRole] });
		const userWithMissingPermission: User = userFactory.buildWithId({ school });

		const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser, userWithMissingPermission] });

		const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();

		em.persist([teacherRole, school, course, teacherUser, userWithMissingPermission, schoolExternalTool]);
		await em.flush();
		em.clear();

		return {
			schoolExternalTool,
			school,
			course,
			teacherUser,
			userWithMissingPermission,
		};
	};

	describe('[POST] tools/context', () => {
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

		it('should create an context external tool', async () => {
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
							contextType: ToolContextType.COURSE,
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
});
