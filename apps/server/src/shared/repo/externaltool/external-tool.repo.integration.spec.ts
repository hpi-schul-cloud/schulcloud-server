import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalTool, ToolConfigType } from '@shared/domain/entity/external-tool';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, externalToolFactory } from '@shared/testing';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';

describe('ExternalToolRepo', () => {
	let module: TestingModule;
	let repo: ExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ExternalToolRepo],
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
		const externalTool: ExternalTool = externalToolFactory.withBasicConfig().buildWithId();
		const externalOauthTool: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
		const externalOauthTool2: ExternalTool = externalToolFactory.withOauth2Config().buildWithId();
		await em.persistAndFlush([externalTool, externalOauthTool, externalOauthTool2]);
		return { externalTool, externalOauthTool, externalOauthTool2 };
	}

	it('getEntityName should return ExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(ExternalTool);
	});

	describe('findByName', () => {
		it('should find an external tool with given toolName', async () => {
			const { externalTool } = await setup();

			const result: ExternalTool | null = await repo.findByName(externalTool.name);

			expect(result).toEqual(expect.objectContaining(externalTool));
		});

		it('should return null when no external tool with the given name was found', async () => {
			await setup();

			const result: ExternalTool | null = await repo.findByName('notExisting');

			expect(result).toBeNull();
		});
	});

	describe('findAllByConfigType', () => {
		it('should find all external tools with given toolConfigType', async () => {
			const { externalOauthTool, externalOauthTool2 } = await setup();

			const result: ExternalTool[] = await repo.findAllByConfigType(ToolConfigType.OAUTH2);

			expect(result.length).toEqual([externalOauthTool, externalOauthTool2].length);
		});

		it('should return an empty array when no externalTools were found', async () => {
			await setup();

			const result: ExternalTool[] = await repo.findAllByConfigType(ToolConfigType.LTI11);

			expect(result.length).toEqual(0);
		});
	});
});
