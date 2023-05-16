import { ExecutionContext, INestApplication } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import {
	ContextExternalTool,
	ContextExternalToolType,
	Course,
	ExternalTool,
	LaunchRequestMethod,
	Permission,
	Role,
	School,
	SchoolExternalTool,
	ToolConfigType,
	User,
} from '@shared/domain';
import {
	basicToolConfigDOFactory,
	contextExternalToolFactory,
	courseFactory,
	externalToolFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import request, { Response } from 'supertest';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '@src/modules/authentication';
import { ServerTestModule } from '@src/modules/server';
import { ToolLaunchParams } from '../dto/tool-launch.params';
import { ToolLaunchRequestResponse } from '../dto/tool-launch-request.response';

describe('ToolLaunchController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;

	let currentUser: ICurrentUser | undefined;

	const BASE_URL = '/tools/context';

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

	describe('[GET] tools/context/{contextExternalToolId}/launch', () => {
		describe('when valid data is given', () => {
			const setup = async () => {
				const role: Role = roleFactory.buildWithId({ permissions: [Permission.CONTEXT_TOOL_USER] });
				const school: School = schoolFactory.buildWithId();
				const user: User = userFactory.buildWithId({ roles: [role], school });
				const course: Course = courseFactory.buildWithId({ school, teachers: [user] });
				currentUser = mapUserToCurrentUser(user);

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					config: basicToolConfigDOFactory.build({ baseUrl: 'http://mockurl.de', type: ToolConfigType.BASIC }),
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					tool: externalTool,
					school,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				const params: ToolLaunchParams = { contextExternalToolId: contextExternalTool.id };

				await em.persistAndFlush([school, user, course, externalTool, schoolExternalTool, contextExternalTool]);
				em.clear();

				return { params };
			};

			it('should return a launch response', async () => {
				const { params } = await setup();

				const response: Response = await request(app.getHttpServer())
					.get(`${BASE_URL}/${params.contextExternalToolId}/launch`)
					.expect(200);

				const body: ToolLaunchRequestResponse = response.body as ToolLaunchRequestResponse;
				expect(body).toEqual<ToolLaunchRequestResponse>({
					method: LaunchRequestMethod.GET,
					url: 'http://mockurl.de/',
					payload: '',
					openNewTab: true,
				});
			});

			// TODO: test unauthorized after merged pr and permission check
		});
	});
});
