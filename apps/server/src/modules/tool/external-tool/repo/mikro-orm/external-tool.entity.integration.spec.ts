import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ExternalToolMediumStatus } from '../../enum';
import { externalToolEntityFactory } from '../../testing';
import { ExternalToolEntity } from './external-tool.entity';

describe('ExternalToolEntity indexes', () => {
	let module: TestingModule;
	let em: EntityManager;
	let orm: MikroORM;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ExternalToolEntity] })],
		}).compile();

		em = module.get(EntityManager);
		orm = module.get(MikroORM);

		await orm.getSchemaGenerator().ensureIndexes();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(ExternalToolEntity, {});
		em.clear();
	});

	describe('when the indexes are synchronized', () => {
		it('should create both unique indexes', async () => {
			const indexes = await em.getConnection().getDb().collection('external-tools').listIndexes().toArray();

			const indexNames = indexes.map((index: { name?: string }) => index.name);

			expect(indexNames).toEqual(
				expect.arrayContaining(['externalToolNameUniqueIndex', 'externalToolMediumIdentityUniqueIndex'])
			);
		});
	});

	describe('when two tools without a mediumId have the same name', () => {
		const setup = () => {
			const tool = externalToolEntityFactory.buildWithId({ name: 'duplicate', medium: undefined });
			const otherTool = externalToolEntityFactory.buildWithId({ name: 'duplicate', medium: undefined });

			return { tool, otherTool };
		};

		it('should reject the second tool', async () => {
			const { tool, otherTool } = setup();
			await em.persist(tool).flush();

			await expect(em.persist(otherTool).flush()).rejects.toThrow('duplicate key error');
		});
	});

	describe('when two templates use the same media source', () => {
		const setup = () => {
			const template = externalToolEntityFactory.buildWithId({
				name: 'template-a',
				medium: { status: ExternalToolMediumStatus.TEMPLATE, mediaSourceId: 'source-1', mediumId: undefined },
			});
			const otherTemplate = externalToolEntityFactory.buildWithId({
				name: 'template-b',
				medium: { status: ExternalToolMediumStatus.TEMPLATE, mediaSourceId: 'source-1', mediumId: undefined },
			});

			return { template, otherTemplate };
		};

		it('should reject the second template despite the different name', async () => {
			const { template, otherTemplate } = setup();
			await em.persist(template).flush();

			await expect(em.persist(otherTemplate).flush()).rejects.toThrow('duplicate key error');
		});
	});

	describe('when two templates use different media sources', () => {
		const setup = () => {
			const template = externalToolEntityFactory.buildWithId({
				name: 'template-a',
				medium: { status: ExternalToolMediumStatus.TEMPLATE, mediaSourceId: 'source-1', mediumId: undefined },
			});
			const otherTemplate = externalToolEntityFactory.buildWithId({
				name: 'template-b',
				medium: { status: ExternalToolMediumStatus.TEMPLATE, mediaSourceId: 'source-2', mediumId: undefined },
			});

			return { template, otherTemplate };
		};

		it('should keep both templates', async () => {
			const { template, otherTemplate } = setup();

			await em.persist([template, otherTemplate]).flush();

			await expect(em.count(ExternalToolEntity)).resolves.toEqual(2);
		});
	});

	describe('when two media tools share the medium identity', () => {
		const setup = () => {
			const tool = externalToolEntityFactory.buildWithId({
				name: 'tool-a',
				medium: { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'medium-1', mediaSourceId: 'source-1' },
			});
			const otherTool = externalToolEntityFactory.buildWithId({
				name: 'tool-b',
				medium: { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'medium-1', mediaSourceId: 'source-1' },
			});

			return { tool, otherTool };
		};

		it('should reject the second tool despite the different name', async () => {
			const { tool, otherTool } = setup();
			await em.persist(tool).flush();

			await expect(em.persist(otherTool).flush()).rejects.toThrow('duplicate key error');
		});
	});

	describe('when two media tools share the name but not the medium identity', () => {
		const setup = () => {
			const tool = externalToolEntityFactory.buildWithId({
				name: 'shared',
				medium: { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'medium-1', mediaSourceId: 'source-1' },
			});
			const otherTool = externalToolEntityFactory.buildWithId({
				name: 'shared',
				medium: { status: ExternalToolMediumStatus.ACTIVE, mediumId: 'medium-2', mediaSourceId: 'source-1' },
			});

			return { tool, otherTool };
		};

		it('should keep both tools', async () => {
			const { tool, otherTool } = setup();

			await em.persist([tool, otherTool]).flush();

			await expect(em.count(ExternalToolEntity)).resolves.toEqual(2);
		});
	});
});
