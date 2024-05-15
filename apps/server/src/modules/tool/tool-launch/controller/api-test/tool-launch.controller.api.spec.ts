import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, SchoolEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	basicToolConfigFactory,
	contextExternalToolFactory,
	courseFactory,
	customParameterFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { Response } from 'supertest';
import { CustomParameterLocation, CustomParameterScope, ToolConfigType } from '../../../common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../../context-external-tool/entity';
import { contextExternalToolEntityFactory } from '../../../context-external-tool/testing';
import { ExternalToolEntity } from '../../../external-tool/entity';
import { externalToolEntityFactory } from '../../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { schoolExternalToolConfigurationStatusEntityFactory } from '../../../school-external-tool/testing/school-external-tool-configuration-status-entity.factory';
import { LaunchRequestMethod } from '../../types';
import { ToolLaunchParams, ToolLaunchRequestResponse } from '../dto';

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
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					config: basicToolConfigFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
					version: 0,
					parameters: [
						customParameterFactory.build({
							name: 'schoolMockParameter',
							scope: CustomParameterScope.SCHOOL,
							location: CustomParameterLocation.PATH,
						}),
						customParameterFactory.build({
							name: 'contextMockParameter',
							scope: CustomParameterScope.CONTEXT,
							location: CustomParameterLocation.PATH,
						}),
					],
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
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
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

		describe('when user wants to launch a deactivated tool', () => {
			describe('when external tool is deactivated', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId();
					const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school }, [
						Permission.CONTEXT_TOOL_USER,
					]);
					const course: Course = courseFactory.buildWithId({ school, teachers: [teacherUser] });

					const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
						config: basicToolConfigFactory.build({ baseUrl: 'https://mockurl.de', type: ToolConfigType.BASIC }),
						version: 1,
						isDeactivated: true,
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

			describe('when school external tool is deactivated', () => {
				const setup = async () => {
					const school: SchoolEntity = schoolEntityFactory.buildWithId();
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
						status: schoolExternalToolConfigurationStatusEntityFactory.build({
							isDeactivated: true,
						}),
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
		});

		describe('when user wants to launch tool from another school', () => {
			const setup = async () => {
				const toolSchool: SchoolEntity = schoolEntityFactory.buildWithId();
				const usersSchool: SchoolEntity = schoolEntityFactory.buildWithId();

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
