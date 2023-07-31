import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, Page, SortOrder } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ExternalToolRepo, ExternalToolRepoMapper } from '@shared/repo';
import { cleanupCollections, externalToolFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolSearchQuery } from '@src/modules/tool';
import { CustomParameterDO } from '@src/modules/tool/common/domain';
import {
	ToolConfigType,
	LtiPrivacyPermission,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
} from '@src/modules/tool/common/enum';
import {
	BasicToolConfigDO,
	ExternalTool,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@src/modules/tool/external-tool/domain';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';

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

		const externalToolEntity: ExternalToolEntity = externalToolFactory.withBasicConfig().buildWithId();
		const externalOauthTool: ExternalToolEntity = externalToolFactory.withOauth2Config('client-1').buildWithId();
		const externalOauthTool2: ExternalToolEntity = externalToolFactory.withOauth2Config('client-2').buildWithId();
		const externalLti11Tool: ExternalToolEntity = externalToolFactory.withLti11Config().buildWithId();

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

			expect((result?.config as Oauth2ToolConfigDO).clientId).toEqual(client1Id);
		});

		it('should return an empty array when no externalTools were found', async () => {
			await setup();

			const result: ExternalTool | null = await repo.findByOAuth2ConfigClientId('unknown-client');

			expect(result).toBeNull();
		});
	});

	describe('save', () => {
		const setupDO = (config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO) => {
			const domainObject: ExternalTool = new ExternalTool({
				name: 'name',
				url: 'url',
				logoUrl: 'logoUrl',
				config,
				parameters: [
					new CustomParameterDO({
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
					}),
				],
				isHidden: true,
				openNewTab: true,
				version: 2,
			});

			return {
				domainObject,
			};
		};

		it('should save an basic tool correctly', async () => {
			const config: BasicToolConfigDO = new BasicToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
			});
			const { domainObject } = setupDO(config);
			const { id, ...expected } = domainObject;

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});

		it('should save an oauth2 tool correctly', async () => {
			const config: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
				clientId: 'clientId',
				skipConsent: true,
			});
			const { domainObject } = setupDO(config);
			const { id, ...expected } = domainObject;

			const result: ExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});

		it('should save an lti11 tool correctly', async () => {
			const config: Lti11ToolConfigDO = new Lti11ToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
				secret: 'secret',
				key: 'key',
				lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
				privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
				resource_link_id: 'resource_link_id',
			});
			const { domainObject } = setupDO(config);
			const { id, ...expected } = domainObject;

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
			const ltiToolA: ExternalToolEntity = externalToolFactory.withName('A').buildWithId();
			const ltiToolB: ExternalToolEntity = externalToolFactory.withName('B').buildWithId();
			const ltiToolC: ExternalToolEntity = externalToolFactory.withName('B').buildWithId();
			const ltiTools: ExternalToolEntity[] = [ltiToolA, ltiToolB, ltiToolC];
			await em.persistAndFlush([ltiToolA, ltiToolB, ltiToolC]);

			return { queryExternalToolDO, options, ltiTools };
		};

		describe('pagination', () => {
			it('should return all ltiTools when options with pagination is set to undefined', async () => {
				const { queryExternalToolDO, ltiTools } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, undefined);

				expect(page.data.length).toBe(ltiTools.length);
			});

			it('should return one ltiTool when pagination has a limit of 1', async () => {
				const { queryExternalToolDO, options } = await setupFind();
				options.pagination = { limit: 1 };

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data.length).toBe(1);
			});

			it('should return no ltiTool when pagination has a limit of 1 and skip is set to 2', async () => {
				const { queryExternalToolDO, options } = await setupFind();
				options.pagination = { limit: 1, skip: 3 };

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data.length).toBe(0);
			});
		});

		describe('order', () => {
			it('should return ltiTools ordered by default _id when no order is specified', async () => {
				const { queryExternalToolDO, options, ltiTools } = await setupFind();

				const page: Page<ExternalTool> = await repo.find(queryExternalToolDO, options);

				expect(page.data[0].name).toEqual(ltiTools[0].name);
				expect(page.data[1].name).toEqual(ltiTools[1].name);
				expect(page.data[2].name).toEqual(ltiTools[2].name);
			});

			it('should return ltiTools ordered by name ascending', async () => {
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
	});
});
