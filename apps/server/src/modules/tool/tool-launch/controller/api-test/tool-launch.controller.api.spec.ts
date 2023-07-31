import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, Permission, Role, School, User } from '@shared/domain';
import {
	basicToolConfigDOFactory,
	contextExternalToolFactory,
	contextExternalToolEntityFactory,
	courseFactory,
	externalToolEntityFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolExternalToolEntityFactory,
	schoolFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { LaunchRequestMethod } from '../../types';
import { ToolLaunchRequestResponse, ToolLaunchParams } from '../dto';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/entity';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { ExternalToolEntity } from '../../../external-tool/entity';
import { ToolConfigType } from '../../../common/enum';

// TODO Refactor to use api testHelpers
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

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigDOFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
					version: 0,
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				const params: ToolLaunchParams = { contextExternalToolId: contextExternalToolEntity.id };

				await em.persistAndFlush([
					school,
					user,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				return { params };
			};

			it('should return a launch response', async () => {
				const { params } = await setup();

				const response: Response = await request(app.getHttpServer())
					.get(`${BASE_URL}/${params.contextExternalToolId}/launch`)
					.expect(HttpStatus.OK);

				const body: ToolLaunchRequestResponse = response.body as ToolLaunchRequestResponse;
				expect(body).toEqual<ToolLaunchRequestResponse>({
					method: LaunchRequestMethod.GET,
					url: 'https://mockurl.de/',
					openNewTab: true,
				});
			});
		});

		describe('when user wants to launch an outdated tool', () => {
			const setup = async () => {
				const role: Role = roleFactory.buildWithId({ permissions: [Permission.CONTEXT_TOOL_USER] });
				const school: School = schoolFactory.buildWithId();
				const user: User = userFactory.buildWithId({ roles: [role], school });
				const course: Course = courseFactory.buildWithId({ school, teachers: [user] });
				currentUser = mapUserToCurrentUser(user);

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigDOFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
					version: 1,
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					toolVersion: 0,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					toolVersion: 0,
				});

				const params: ToolLaunchParams = { contextExternalToolId: contextExternalToolEntity.id };

				await em.persistAndFlush([
					school,
					user,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				return { params };
			};

			it('should return a bad request', async () => {
				const { params } = await setup();

				const response: Response = await request(app.getHttpServer()).get(
					`${BASE_URL}/${params.contextExternalToolId}/launch`
				);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user wants to launch tool from another school', () => {
			const setup = async () => {
				const role: Role = roleFactory.buildWithId({ permissions: [] });

				const toolSchool: School = schoolFactory.buildWithId();
				const usersSchool: School = schoolFactory.buildWithId();

				const user: User = userFactory.buildWithId({ roles: [role], school: usersSchool });
				const course: Course = courseFactory.buildWithId({ school: usersSchool, teachers: [user] });
				currentUser = mapUserToCurrentUser(user);

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigDOFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school: toolSchool,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				const params: ToolLaunchParams = { contextExternalToolId: contextExternalToolEntity.id };

				await em.persistAndFlush([
					toolSchool,
					usersSchool,
					user,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				return { params };
			};

			it('should return forbidden', async () => {
				const { params } = await setup();

				await request(app.getHttpServer())
					.get(`${BASE_URL}/${params.contextExternalToolId}/launch`)
					.expect(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const contextExternalTool = contextExternalToolFactory.buildWithId();
				const params: ToolLaunchParams = {
					contextExternalToolId: contextExternalTool.id as string,
				};
				currentUser = undefined;

				await request(app.getHttpServer())
					.get(`${BASE_URL}/${params.contextExternalToolId}/launch`)
					.expect(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
