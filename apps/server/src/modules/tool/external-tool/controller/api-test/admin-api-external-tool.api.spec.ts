import { EntityManager, MikroORM } from '@mikro-orm/core';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@shared/testing';
// admin-api-external-tool and test file is wrong placed need to be part of a admin-api-module folder
import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import {
	CustomParameterLocationParams,
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	ToolConfigType,
} from '../../../common/enum';
import { ExternalToolEntity } from '../../entity';
import { ExternalToolCreateParams, ExternalToolResponse } from '../dto';

describe('AdminApiExternalTool (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let orm: MikroORM;
	let testApiClient: TestApiClient;

	const basePath = 'admin/tools/external-tools';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		orm = app.get(MikroORM);

		const apiKeys = adminApiServerConfig().ADMIN_API__ALLOWED_API_KEYS as string[]; // check config/test.json
		testApiClient = new TestApiClient(app, basePath, apiKeys[0], true);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await orm.getSchemaGenerator().clearDatabase();
	});

	describe('[POST] admin/tools/external-tools', () => {
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
			describe('when valid data is given', () => {
				const setup = () => {
					const postParams: ExternalToolCreateParams = {
						name: 'Tool 1',
						parameters: [
							{
								name: 'key',
								description: 'This is a parameter.',
								displayName: 'User Friendly Name',
								defaultValue: 'abc',
								isOptional: false,
								isProtected: false,
								type: CustomParameterTypeParams.STRING,
								regex: 'abc',
								regexComment: 'Regex accepts "abc" as value.',
								location: CustomParameterLocationParams.PATH,
								scope: CustomParameterScopeTypeParams.GLOBAL,
							},
						],
						config: {
							type: ToolConfigType.BASIC,
							baseUrl: 'https://link.to-my-tool.com/:key',
						},
						isHidden: false,
						isDeactivated: false,
						logoUrl: 'https://link.to-my-logo.com',
						url: 'https://link.to-my-tool.com',
						openNewTab: true,
						thumbnailUrl: 'https://link.to-my-thumbnail.com',
					};

					return {
						postParams,
					};
				};

				it('should create a tool', async () => {
					const { postParams } = setup();

					const response = await testApiClient.post().send(postParams);

					const body: ExternalToolResponse = response.body as ExternalToolResponse;

					expect(response.status).toEqual(HttpStatus.CREATED);
					expect(response.body).toMatchObject<ExternalToolResponse>({
						id: body.id,
						name: 'Tool 1',
						parameters: [
							{
								name: 'key',
								description: 'This is a parameter.',
								displayName: 'User Friendly Name',
								defaultValue: 'abc',
								isOptional: false,
								isProtected: false,
								type: CustomParameterTypeParams.STRING,
								regex: 'abc',
								regexComment: 'Regex accepts "abc" as value.',
								location: CustomParameterLocationParams.PATH,
								scope: CustomParameterScopeTypeParams.GLOBAL,
							},
						],
						config: {
							type: ToolConfigType.BASIC,
							baseUrl: 'https://link.to-my-tool.com/:key',
						},
						isHidden: false,
						isDeactivated: false,
						url: 'https://link.to-my-tool.com',
						openNewTab: true,
					});

					const externalTool = await em.findOne(ExternalToolEntity, { id: body.id });
					expect(externalTool).toBeDefined();
				});
			});
		});
	});
});
