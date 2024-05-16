import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalToolSearchQuery } from '@modules/tool';
import { CustomParameter } from '@modules/tool/common/domain';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	ToolConfigType,
} from '@modules/tool/common/enum';
import { BasicToolConfig, ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '@modules/tool/external-tool/domain';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { externalToolEntityFactory, externalToolFactory } from '@modules/tool/external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { ExternalToolRepo, ExternalToolRepoMapper } from '@shared/repo';
import { cleanupCollections } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';

describe('ExternalToolRepo', () => {
	let module: TestingModule;
	let repo: ExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				ExternalToolRepo,
				ExternalToolRepoMapper,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		repo = module.get(ExternalToolRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const client1Id = 'client-1';
		const client2Id = 'client-2';

		const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.withBasicConfig().buildWithId();
		const externalOauthTool: ExternalToolEntity = externalToolEntityFactory.withOauth2Config('client-1').buildWithId();
		const externalOauthTool2: ExternalToolEntity = externalToolEntityFactory.withOauth2Config('client-2').buildWithId();
		const externalLti11Tool: ExternalToolEntity = externalToolEntityFactory.withLti11Config().buildWithId();

		await em.persistAndFlush([externalToolEntity, externalOauthTool, externalOauthTool2, externalLti11Tool]);
		em.clear();

		const queryExternalToolDO: ExternalToolSearchQuery = { name: 'external-tool-*' };

		return {
			externalToolEntity,
			externalOauthTool,
			externalOauthTool2,
			externalLti11Tool,
			client1Id,
			client2Id,
			queryExternalToolDO,
		};
	};

	it('getEntityName should return ExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(ExternalToolEntity);
	});

	describe('findByName', () => {
		it('should find an external tool with given toolName', async () => {
			const { externalToolEntity } = await setup();

			const result: ExternalTool | null = await repo.findByName(externalToolEntity.name);

			expect(result?.name).toEqual(externalToolEntity.name);
		});

		it('should return null when no external tool with the given name was found', async () => {
			await setup();

			const result: ExternalTool | null = await repo.findByName('notExisting');

			expect(result).toBeNull();
		});
	});

	describe('findAllByConfigType', () => {
		it('should find all external tools with given toolConfigType', async () => {
			await setup();

			const result: ExternalTool[] = await repo.findAllByConfigType(ToolConfigType.OAUTH2);

			expect(result.length).toEqual(2);
		});

		it('should return an empty array when no externalTools were found', async () => {
			const result: ExternalTool[] = await repo.findAllByConfigType(ToolConfigType.LTI11);

			expect(result.length).toEqual(0);
		});
	});

	describe('findByOAuth2ConfigClientId', () => {
		it('should find external tool with given client id', async () => {
			const { client1Id } = await setup();

			const result: ExternalTool | null = await repo.findByOAuth2ConfigClientId(client1Id);

			expect((result?.config as Oauth2ToolConfig).clientId).toEqual(client1Id);
		});

		it('should return an empty array when no externalTools were found', async () => {
			await setup();

			const result: ExternalTool | null = await repo.findByOAuth2ConfigClientId('unknown-client');

			expect(result).toBeNull();
		});
	});

	describe('save', () => {
		const setupDO = (config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig) => {
			const domainObject: ExternalTool = externalToolFactory.build({
				name: 'name',
				url: 'url',
				logoUrl: 'logoUrl',
				config,
				parameters: [
					new CustomParameter({
						name: 'name',
						regex: 'regex',
						displayName: 'displayName',
						description: 'description',
						type: CustomParameterType.NUMBER,
						scope: CustomParameterScope.SCHOOL,
						default: 'default',
						location: CustomParameterLocation.BODY,
						regexComment: 'mockComment',
						isOptional: false,
						isProtected: false,
					}),
				],
				isHidden: true,
				openNewTab: true,
				isDeactivated: false,
			});

			return {
				domainObject,
			};
		};

		it('should save an basic tool correctly', async () => {
			const config: BasicToolConfig = new BasicToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
			});
			const { domainObject } = setupDO(config);
			const { id, createdAt, ...expected } = domainObject;

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});

		it('should save an oauth2 tool correctly', async () => {
			const config: Oauth2ToolConfig = new Oauth2ToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
				clientId: 'clientId',
				skipConsent: true,
			});
			const { domainObject } = setupDO(config);
			const { id, createdAt, ...expected } = domainObject;

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});

		it('should save an lti11 tool correctly', async () => {
			const config: Lti11ToolConfig = new Lti11ToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
				secret: 'secret',
				key: 'key',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
				launch_presentation_locale: 'de-DE',
			});
			const { domainObject } = setupDO(config);
			const { id, createdAt, ...expected } = domainObject;

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});
	});

	describe('find', () => {
		const setupFind = async () => {
			const { queryExternalToolDO } = await setup();
			queryExternalToolDO.name = '.';

			const options: IFindOptions<ExternalTool> = {};

			await em.nativeDelete(ExternalToolEntity, {});
			const ltiToolA: ExternalToolEntity = externalToolEntityFactory.withName('A').buildWithId();
			const ltiToolB: ExternalToolEntity = externalToolEntityFactory.withName('B').buildWithId();
			const ltiToolC: ExternalToolEntity = externalToolEntityFactory.withName('B').buildWithId();
			const ltiTools: ExternalToolEntity[] = [ltiToolA, ltiToolB, ltiToolC];
			await em.persistAndFlush([ltiToolA, ltiToolB, ltiToolC]);

			return { queryExternalToolDO, options, ltiTools };
		};

		describe('pagination', () => {
			it('should return all external tools when options with pagination is set to undefined', async () => {
				const { queryExternalToolDO, ltiTools } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, undefined);

				expect(page.data.length).toBe(ltiTools.length);
			});

			it('should return one external tools when pagination has a limit of 1', async () => {
				const { queryExternalToolDO, options } = await setupFind();
				options.pagination = { limit: 1 };

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data.length).toBe(1);
			});

			it('should return no external tools when pagination has a limit of 1 and skip is set to 2', async () => {
				const { queryExternalToolDO, options } = await setupFind();
				options.pagination = { limit: 1, skip: 3 };

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data.length).toBe(0);
			});
		});

		describe('order', () => {
			it('should return external tools ordered by default _id when no order is specified', async () => {
				const { queryExternalToolDO, options, ltiTools } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});

			it('should return external tools ordered by name ascending', async () => {
				const { queryExternalToolDO, options, ltiTools } = await setupFind();

				options.order = {
					name: SortOrder.asc,
				};

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});
		});

		describe('when query is given', () => {
			describe('by ids', () => {
				it('should return external tools for given ids', async () => {
					const { options, ltiTools } = await setupFind();
					const query: ExternalToolSearchQuery = { ids: [ltiTools[0].id, ltiTools[1].id] };

					const page: Page<ExternalTool> = await repo.find(query, options);

					expect(page.data.length).toBe(2);
					expect(page.data[0].name).toEqual(ltiTools[0].name);
					expect(page.data[1].name).toEqual(ltiTools[1].name);
				});
			});
		});
	});
});
