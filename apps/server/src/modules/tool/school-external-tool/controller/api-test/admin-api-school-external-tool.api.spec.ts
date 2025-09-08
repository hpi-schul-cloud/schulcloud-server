import { EntityManager, MikroORM } from '@mikro-orm/core';
import { schoolEntityFactory } from '@modules/school/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// admin-api-external-tool and test file is wrong placed need to be part of a admin-api-module folder
import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { TestApiClient } from '@testing/test-api-client';
import { CustomParameterScope, CustomParameterType } from '../../../common/enum';
import { ExternalToolResponse } from '../../../external-tool/controller/dto';
import { ExternalToolEntity } from '../../../external-tool/repo';
import { customParameterEntityFactory, externalToolEntityFactory } from '../../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../repo';
import { schoolExternalToolConfigurationStatusFactory } from '../../testing';
import { SchoolExternalToolPostParams, SchoolExternalToolResponse } from '../dto';

describe('AdminApiSchoolExternalTool (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	const basePath = 'admin/tools/school-external-tools';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		orm = app.get(MikroORM);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const apiKeys = adminApiServerConfig().ADMIN_API__ALLOWED_API_KEYS as string[]; // check config/test.json
		testApiClient = new TestApiClient(app, basePath, apiKeys[0], true);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	describe('[POST] admin/tools/school-external-tools', () => {
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
				const school = schoolEntityFactory.buildWithId();
				const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
					parameters: [
						customParameterEntityFactory.build({
							name: 'param1',
							scope: CustomParameterScope.SCHOOL,
							type: CustomParameterType.STRING,
							isOptional: false,
						}),
						customParameterEntityFactory.build({
							name: 'param2',
							scope: CustomParameterScope.SCHOOL,
							type: CustomParameterType.BOOLEAN,
							isOptional: true,
						}),
					],
				});

				const postParams: SchoolExternalToolPostParams = {
					toolId: externalToolEntity.id,
					schoolId: school.id,
					parameters: [
						{ name: 'param1', value: 'value' },
						{ name: 'param2', value: 'false' },
					],
					isDeactivated: false,
				};

				await em.persistAndFlush([school, externalToolEntity]);
				em.clear();

				return {
					postParams,
					externalToolEntity,
				};
			};

			it('should create a school external tool', async () => {
				const { postParams, externalToolEntity } = await setup();

				const response = await testApiClient.post().send(postParams);

				const body: ExternalToolResponse = response.body as ExternalToolResponse;

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(body).toEqual<SchoolExternalToolResponse>({
					id: expect.any(String),
					isDeactivated: postParams.isDeactivated,
					name: externalToolEntity.name,
					schoolId: postParams.schoolId,
					toolId: postParams.toolId,
					status: schoolExternalToolConfigurationStatusFactory.build({
						isOutdatedOnScopeSchool: false,
					}),
					parameters: [
						{ name: 'param1', value: 'value' },
						{ name: 'param2', value: 'false' },
					],
				});

				const schoolExternalTool: SchoolExternalToolEntity | null = await em.findOne(SchoolExternalToolEntity, {
					id: body.id,
				});
				expect(schoolExternalTool).toBeDefined();
			});
		});
	});
});
