import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, SchoolEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	contextExternalToolConfigurationStatusResponseFactory,
	courseFactory,
	customParameterFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';

import { Response } from 'supertest';
import { CustomParameterLocation, CustomParameterScope, ToolContextType } from '../../../common/enum';
import { ExternalToolEntity } from '../../../external-tool/entity';
import { externalToolEntityFactory } from '../../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../entity';
import { contextExternalToolEntityFactory } from '../../testing';
import { ContextExternalToolContextParams, ToolReferenceListResponse, ToolReferenceResponse } from '../dto';

describe('ToolReferenceController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();

		await app.init();

		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'tools/tool-references');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] tools/tool-references/:contextType/:contextId', () => {
		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.get(`contextType/${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has no access to a tool', () => {
			const setup = async () => {
				const schoolWithoutTool: SchoolEntity = schoolEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school: schoolWithoutTool });
				const course: Course = courseFactory.buildWithId({ school, teachers: [adminUser] });
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalToolEntity,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const params: ContextExternalToolContextParams = {
					contextId: course.id,
					contextType: ToolContextType.COURSE,
				};

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params };
			};

			it('should filter out the tool', async () => {
				const { loggedInClient, params } = await setup();

				const response: Response = await loggedInClient.get(`${params.contextType}/${params.contextId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ToolReferenceListResponse>({ data: [] });
			});
		});

		describe('when user has access for a tool', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school, teachers: [adminUser] });
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					logoBase64: 'logoBase64',
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
					school,
					tool: externalToolEntity,
					toolVersion: externalToolEntity.version,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'This is a test tool',
					toolVersion: schoolExternalToolEntity.toolVersion,
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const params: ContextExternalToolContextParams = {
					contextId: course.id,
					contextType: ToolContextType.COURSE,
				};

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return { loggedInClient, params, contextExternalToolEntity, externalToolEntity };
			};

			it('should return an ToolReferenceListResponse with data', async () => {
				const { loggedInClient, params, contextExternalToolEntity, externalToolEntity } = await setup();

				const response: Response = await loggedInClient.get(`${params.contextType}/${params.contextId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ToolReferenceListResponse>({
					data: [
						{
							contextToolId: contextExternalToolEntity.id,
							description: externalToolEntity.description,
							displayName: contextExternalToolEntity.displayName as string,
							status: contextExternalToolConfigurationStatusResponseFactory.build({
								isOutdatedOnScopeSchool: false,
								isOutdatedOnScopeContext: false,
							}),
							logoUrl: `http://localhost:3030/api/v3/tools/external-tools/${externalToolEntity.id}/logo`,
							openInNewTab: externalToolEntity.openNewTab,
						},
					],
				});
			});
		});
	});

	describe('[GET] tools/tool-references/context-external-tools/:contextExternalToolId', () => {
		describe('when user is not authenticated', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.get(`context-external-tools/${new ObjectId().toHexString()}`);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has no access to a tool', () => {
			const setup = async () => {
				const schoolWithoutTool: SchoolEntity = schoolEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school: schoolWithoutTool });
				const course: Course = courseFactory.buildWithId({ school, teachers: [adminUser] });
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalToolEntity,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					contextExternalToolId: contextExternalToolEntity.id,
				};
			};

			it('should filter out the tool', async () => {
				const { loggedInClient, contextExternalToolId } = await setup();

				const response: Response = await loggedInClient.get(`context-external-tools/${contextExternalToolId}`);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user has access for a tool', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course: Course = courseFactory.buildWithId({ school, teachers: [adminUser] });
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					logoBase64: 'logoBase64',
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
					school,
					tool: externalToolEntity,
					toolVersion: externalToolEntity.version,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'This is a test tool',
					toolVersion: schoolExternalToolEntity.toolVersion,
				});

				await em.persistAndFlush([
					school,
					adminAccount,
					adminUser,
					course,
					externalToolEntity,
					schoolExternalToolEntity,
					contextExternalToolEntity,
				]);
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					contextExternalToolId: contextExternalToolEntity.id,
					contextExternalToolEntity,
					externalToolEntity,
				};
			};

			it('should return an ToolReferenceListResponse with data', async () => {
				const { loggedInClient, contextExternalToolId, contextExternalToolEntity, externalToolEntity } = await setup();

				const response: Response = await loggedInClient.get(`context-external-tools/${contextExternalToolId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ToolReferenceResponse>({
					contextToolId: contextExternalToolEntity.id,
					description: externalToolEntity.description,
					displayName: contextExternalToolEntity.displayName as string,
					status: contextExternalToolConfigurationStatusResponseFactory.build({
						isOutdatedOnScopeSchool: false,
						isOutdatedOnScopeContext: false,
					}),
					logoUrl: `http://localhost:3030/api/v3/tools/external-tools/${externalToolEntity.id}/logo`,
					openInNewTab: externalToolEntity.openNewTab,
				});
			});
		});
	});
});
