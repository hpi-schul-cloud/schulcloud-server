import { EntityManager, MikroORM } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain/entity/course.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { contextExternalToolEntityFactory } from '@shared/testing/factory/context-external-tool-entity.factory';
import { courseFactory } from '@shared/testing/factory/course.factory';
import { contextExternalToolFactory } from '@shared/testing/factory/domainobject/tool/context-external-tool.factory';
import { basicToolConfigFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { externalToolEntityFactory } from '@shared/testing/factory/external-tool-entity.factory';
import { schoolExternalToolEntityFactory } from '@shared/testing/factory/school-external-tool-entity.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { UserAndAccountTestFactory } from '@shared/testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@shared/testing/test-api-client';
import { ServerTestModule } from '@src/modules/server/server.module';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { ContextExternalToolType } from '@src/modules/tool/context-external-tool/entity/context-external-tool-type.enum';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity/context-external-tool.entity';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity/external-tool.entity';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity/school-external-tool.entity';

import { Response } from 'supertest';
import { LaunchRequestMethod } from '../../types/launch-request-method';
import { ToolLaunchRequestResponse } from '../dto/tool-launch-request.response';
import { ToolLaunchParams } from '../dto/tool-launch.params';

describe('ToolLaunchController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	const BASE_URL = '/tools/context';

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		orm = app.get(MikroORM);
		testApiClient = new TestApiClient(app, BASE_URL);
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
				const school: SchoolEntity = schoolFactory.buildWithId();
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
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
					teacherUser,
					teacherAccount,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return { params, loggedInClient };
			};

			it('should return a launch response', async () => {
				const { params, loggedInClient } = await setup();

				const response: Response = await loggedInClient.get(`${params.contextExternalToolId}/launch`);

				expect(response.statusCode).toEqual(HttpStatus.OK);

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
				const school: SchoolEntity = schoolFactory.buildWithId();
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
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
					teacherUser,
					teacherAccount,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return { params, loggedInClient };
			};

			it('should return a bad request', async () => {
				const { params, loggedInClient } = await setup();

				const response: Response = await loggedInClient.get(`${params.contextExternalToolId}/launch`);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user wants to launch tool from another school', () => {
			const setup = async () => {
				const toolSchool: SchoolEntity = schoolFactory.buildWithId();
				const usersSchool: SchoolEntity = schoolFactory.buildWithId();

				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school: usersSchool }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school: usersSchool, teachers: [teacherUser] });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
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
					teacherUser,
					teacherAccount,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(teacherAccount);

				return { params, loggedInClient };
			};

			it('should return forbidden', async () => {
				const { params, loggedInClient } = await setup();

				const response = await loggedInClient.get(`${params.contextExternalToolId}/launch`);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = () => {
				const contextExternalTool = contextExternalToolFactory.buildWithId();
				const params: ToolLaunchParams = {
					contextExternalToolId: contextExternalTool.id as string,
				};

				return { params };
			};

			it('should return unauthorized', async () => {
				const { params } = setup();

				const response = await testApiClient.get(`${params.contextExternalToolId}/launch`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
