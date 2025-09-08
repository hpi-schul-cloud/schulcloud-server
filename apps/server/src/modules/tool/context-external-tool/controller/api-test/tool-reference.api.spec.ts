import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { DateToString } from '@testing/date-to-string';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Response } from 'supertest';
import { CustomParameterLocation, CustomParameterScope, LtiMessageType, ToolContextType } from '../../../common/enum';
import { customParameterFactory, externalToolEntityFactory } from '../../../external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolEntity, ContextExternalToolType } from '../../repo';
import {
	contextExternalToolConfigurationStatusResponseFactory,
	contextExternalToolEntityFactory,
	ltiDeepLinkEmbeddableFactory,
} from '../../testing';
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
				const schoolWithoutTool = schoolEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school: schoolWithoutTool });
				const course = courseEntityFactory.buildWithId({ school, teachers: [adminUser] });
				const externalToolEntity = externalToolEntityFactory.buildWithId();
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
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
				const school = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course = courseEntityFactory.buildWithId({ school, teachers: [adminUser] });
				const fileRecordId = new ObjectId();
				const fileName = 'test.png';
				const externalToolEntity = externalToolEntityFactory.buildWithId({
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
					thumbnail: {
						uploadUrl: 'https://uploadurl.com',
						fileRecord: fileRecordId,
						fileName,
					},
				});
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalToolEntity,
				});
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'This is a test tool',
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

				return {
					loggedInClient,
					params,
					contextExternalToolEntity,
					externalToolEntity,
					fileRecordId,
					fileName,
				};
			};

			it('should return an ToolReferenceListResponse with data', async () => {
				const { loggedInClient, params, contextExternalToolEntity, externalToolEntity, fileRecordId, fileName } =
					await setup();

				const response: Response = await loggedInClient.get(`${params.contextType}/${params.contextId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<ToolReferenceListResponse>({
					data: [
						{
							contextToolId: contextExternalToolEntity.id,
							description: externalToolEntity.description,
							displayName: contextExternalToolEntity.displayName as string,
							domain: new URL(externalToolEntity.config.baseUrl).hostname,
							status: contextExternalToolConfigurationStatusResponseFactory.build({
								isOutdatedOnScopeSchool: false,
								isOutdatedOnScopeContext: false,
							}),
							logoUrl: `http://localhost:3030/api/v3/tools/external-tools/${externalToolEntity.id}/logo`,
							openInNewTab: externalToolEntity.openNewTab,
							thumbnailUrl: `/api/v3/file/preview/${fileRecordId.toHexString()}/${encodeURIComponent(fileName)}`,
							isLtiDeepLinkingTool: false,
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
				const schoolWithoutTool = schoolEntityFactory.buildWithId();
				const school = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school: schoolWithoutTool });
				const course = courseEntityFactory.buildWithId({ school, teachers: [adminUser] });
				const externalToolEntity = externalToolEntityFactory.buildWithId();
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
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
				const school = schoolEntityFactory.buildWithId();
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.CONTEXT_TOOL_USER,
				]);
				const course = courseEntityFactory.buildWithId({ school, teachers: [adminUser] });
				const fileRecordId = new ObjectId();
				const fileName = 'test.png';
				const externalToolEntity = externalToolEntityFactory
					.withLti11Config({
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
					})
					.buildWithId({
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
						thumbnail: {
							uploadUrl: 'https://uploadurl.com',
							fileRecord: fileRecordId,
							fileName,
						},
					});
				const schoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					school,
					tool: externalToolEntity,
				});
				const ltiDeepLinkEmbeddable = ltiDeepLinkEmbeddableFactory.build();
				const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
					schoolTool: schoolExternalToolEntity,
					contextId: course.id,
					contextType: ContextExternalToolType.COURSE,
					displayName: 'This is a test tool',
					ltiDeepLink: ltiDeepLinkEmbeddable,
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
					ltiDeepLinkEmbeddable,
					fileRecordId,
					fileName,
				};
			};

			it('should return an ToolReferenceListResponse with data', async () => {
				const {
					loggedInClient,
					contextExternalToolId,
					contextExternalToolEntity,
					externalToolEntity,
					ltiDeepLinkEmbeddable,
					fileRecordId,
					fileName,
				} = await setup();

				const response: Response = await loggedInClient.get(`context-external-tools/${contextExternalToolId}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual<DateToString<ToolReferenceResponse>>({
					contextToolId: contextExternalToolEntity.id,
					description: externalToolEntity.description,
					displayName: contextExternalToolEntity.displayName as string,
					domain: new URL(externalToolEntity.config.baseUrl).hostname,
					status: contextExternalToolConfigurationStatusResponseFactory.build({
						isOutdatedOnScopeSchool: false,
						isOutdatedOnScopeContext: false,
					}),
					logoUrl: `http://localhost:3030/api/v3/tools/external-tools/${externalToolEntity.id}/logo`,
					openInNewTab: externalToolEntity.openNewTab,
					thumbnailUrl: `/api/v3/file/preview/${fileRecordId.toHexString()}/${encodeURIComponent(fileName)}`,
					isLtiDeepLinkingTool: true,
					ltiDeepLink: {
						mediaType: ltiDeepLinkEmbeddable.mediaType,
						title: ltiDeepLinkEmbeddable.title,
						text: ltiDeepLinkEmbeddable.text,
						availableFrom: ltiDeepLinkEmbeddable.availableFrom?.toISOString(),
						availableUntil: ltiDeepLinkEmbeddable.availableUntil?.toISOString(),
						submissionFrom: ltiDeepLinkEmbeddable.submissionFrom?.toISOString(),
						submissionUntil: ltiDeepLinkEmbeddable.submissionUntil?.toISOString(),
					},
				});
			});
		});
	});
});
