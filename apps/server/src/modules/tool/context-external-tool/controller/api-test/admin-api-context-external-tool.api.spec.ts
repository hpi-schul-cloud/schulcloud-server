import { EntityManager, MikroORM } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, SchoolEntity } from '@shared/domain/entity';
import { courseFactory, schoolEntityFactory, TestApiClient } from '@shared/testing';
import { serverConfig } from '../../../../server';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.module';
import { ToolContextType } from '../../../common/enum';
import { ExternalToolResponse } from '../../../external-tool/controller/dto';
import { CustomParameterScope, CustomParameterType, ExternalToolEntity } from '../../../external-tool/entity';
import { customParameterEntityFactory, externalToolEntityFactory } from '../../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../../school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { ContextExternalToolEntity } from '../../entity';
import { ContextExternalToolPostParams, ContextExternalToolResponse } from '../dto';

describe('AdminApiContextExternalTool (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	const apiKey = 'validApiKey';

	const basePath = 'admin/tools/context-external-tools';

	beforeAll(async () => {
		serverConfig().ADMIN_API__ALLOWED_API_KEYS = [apiKey];

		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		orm = app.get(MikroORM);
		testApiClient = new TestApiClient(app, basePath, apiKey, true);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	describe('[POST] admin/tools/context-external-tools', () => {
		describe('when authenticating without an api token', () => {
			it('should return unauthorized', async () => {
				const client = new TestApiClient(app, basePath);

				const response = await client.post();

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when authenticating with an invalid api token', () => {
			it('should return unauthorized', async () => {
				const client = new TestApiClient(app, basePath, 'invalidApiKey', true);

				const response = await client.post();

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when authenticating with a valid api token', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const course: Course = courseFactory.buildWithId({ school });
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [
						customParameterEntityFactory.build({
							name: 'param1',
							scope: CustomParameterScope.CONTEXT,
							type: CustomParameterType.STRING,
							isOptional: false,
						}),
						customParameterEntityFactory.build({
							name: 'param2',
							scope: CustomParameterScope.CONTEXT,
							type: CustomParameterType.BOOLEAN,
							isOptional: true,
						}),
					],
				});
				const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
					tool: externalToolEntity,
					school,
					schoolParameters: [],
				});

				const postParams: ContextExternalToolPostParams = {
					schoolToolId: schoolExternalToolEntity.id,
					contextId: course.id,
					displayName: course.name,
					contextType: ToolContextType.COURSE,
					parameters: [
						{ name: 'param1', value: 'value' },
						{ name: 'param2', value: 'true' },
					],
				};

				await em.persistAndFlush([school, externalToolEntity]);
				em.clear();

				return {
					postParams,
				};
			};

			it('should create a context external tool', async () => {
				const { postParams } = await setup();

				const response = await testApiClient.post().send(postParams);

				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(body).toEqual<ContextExternalToolResponse>({
					id: expect.any(String),
					schoolToolId: postParams.schoolToolId,
					contextId: postParams.contextId,
					displayName: postParams.displayName,
					contextType: postParams.contextType,
					parameters: [
						{ name: 'param1', value: 'value' },
						{ name: 'param2', value: 'true' },
					],
				});

				const contextExternalTool: ContextExternalToolEntity | null = await em.findOne(ContextExternalToolEntity, {
					id: body.id,
				});
				expect(contextExternalTool).toBeDefined();
			});
		});
	});
});
