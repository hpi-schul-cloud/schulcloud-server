import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalTool,
	ToolConfigType,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, externalToolFactory } from '@shared/testing';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { Logger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '@src/modules/tool/interface/lti-privacy-permission.enum';

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
					provide: Logger,
					useValue: createMock<Logger>(),
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

	async function setup() {
		const client1Id = 'client-1';
		const client2Id = 'client-2';

		const externalTool: ExternalTool = externalToolFactory.withBasicConfig().buildWithId();
		const externalOauthTool: ExternalTool = externalToolFactory.withOauth2Config('client-1').buildWithId();
		const externalOauthTool2: ExternalTool = externalToolFactory.withOauth2Config('client-2').buildWithId();
		const externalLti11Tool: ExternalTool = externalToolFactory.withLti11Config().buildWithId();

		await em.persistAndFlush([externalTool, externalOauthTool, externalOauthTool2, externalLti11Tool]);
		em.clear();

		return { externalTool, externalOauthTool, externalOauthTool2, externalLti11Tool, client1Id, client2Id };
	}

	it('getEntityName should return ExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(ExternalTool);
	});

	describe('findByName', () => {
		it('should find an external tool with given toolName', async () => {
			const { externalTool } = await setup();

			const result: ExternalToolDO | null = await repo.findByName(externalTool.name);

			expect(result?.name).toEqual(externalTool.name);
		});

		it('should return null when no external tool with the given name was found', async () => {
			await setup();

			const result: ExternalToolDO | null = await repo.findByName('notExisting');

			expect(result).toBeNull();
		});
	});

	describe('findAllByConfigType', () => {
		it('should find all external tools with given toolConfigType', async () => {
			await setup();

			const result: ExternalToolDO[] = await repo.findAllByConfigType(ToolConfigType.OAUTH2);

			expect(result.length).toEqual(2);
		});

		it('should return an empty array when no externalTools were found', async () => {
			const result: ExternalToolDO[] = await repo.findAllByConfigType(ToolConfigType.LTI11);

			expect(result.length).toEqual(0);
		});
	});

	describe('findByOAuth2ConfigClientId', () => {
		it('should find external tool with given client id', async () => {
			const { client1Id } = await setup();

			const result: ExternalToolDO | null = await repo.findByOAuth2ConfigClientId(client1Id);

			expect((result?.config as Oauth2ToolConfigDO).clientId).toEqual(client1Id);
		});

		it('should return an empty array when no externalTools were found', async () => {
			await setup();

			const result: ExternalToolDO | null = await repo.findByOAuth2ConfigClientId('unknown-client');

			expect(result).toBeNull();
		});
	});

	describe('save', () => {
		function setupDO(config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO) {
			const domainObject: ExternalToolDO = new ExternalToolDO({
				name: 'name',
				url: 'url',
				logoUrl: 'logoUrl',
				config,
				parameters: [
					new CustomParameterDO({
						name: 'name',
						regex: 'regex',
						type: CustomParameterType.NUMBER,
						scope: CustomParameterScope.SCHOOL,
						default: 'default',
						location: CustomParameterLocation.TOKEN,
					}),
				],
				isHidden: true,
				openNewTab: true,
				version: 2,
			});

			return {
				domainObject,
			};
		}

		it('should save an basic tool correctly', async () => {
			const config: BasicToolConfigDO = new BasicToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
			});
			const { domainObject } = setupDO(config);
			const { id, updatedAt, createdAt, ...expected } = domainObject;

			const result: ExternalToolDO = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
		});

		it('should save an oauth2 tool correctly', async () => {
			const config: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'baseUrl',
				clientId: 'clientId',
				skipConsent: true,
			});
			const { domainObject } = setupDO(config);
			const { id, updatedAt, createdAt, ...expected } = domainObject;

			const result: ExternalToolDO = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
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
			const { id, updatedAt, createdAt, ...expected } = domainObject;

			const result: ExternalToolDO = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
		});
	});
});
