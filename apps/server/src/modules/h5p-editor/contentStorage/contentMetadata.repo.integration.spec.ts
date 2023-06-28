import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, contentMetadataFactory } from '@shared/testing';
import { ContentMetadata } from './contentMetadata.entity';
import { ContentMetadataRepo } from './contentMetadata.repo';

const cmSortFunction = ({ contentId: aId }: ContentMetadata, { contentId: bId }: ContentMetadata) =>
	aId.localeCompare(bId);

describe('ContentMetadataRepo', () => {
	let module: TestingModule;
	let repo: ContentMetadataRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ContentMetadata] })],
			providers: [ContentMetadataRepo],
		}).compile();

		repo = module.get(ContentMetadataRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(ContentMetadata);
	});

	describe('createContentMetadata', () => {
		it('should be able to retrieve entity', async () => {
			const contentMetadata = contentMetadataFactory.build();
			await em.persistAndFlush(contentMetadata);

			const result = await repo.findById(contentMetadata.contentId);

			expect(result).toBeDefined();
			expect(result).toEqual(contentMetadata);
		});
	});

	describe('findById', () => {
		it('should be able to retrieve entity', async () => {
			const contentMetadata = contentMetadataFactory.build();
			await em.persistAndFlush(contentMetadata);

			const result = await repo.findById(contentMetadata.contentId);

			expect(result).toBeDefined();
			expect(result).toEqual(contentMetadata);
		});

		it('should fail if entity does not exist', async () => {
			const id = 'wrong-id';

			const findById = repo.findById(id);

			await expect(findById).rejects.toThrow();
		});
	});

	describe('deleteContentMetadata', () => {
		it('should delete data', async () => {
			const contentMetadata = contentMetadataFactory.build();
			await em.persistAndFlush(contentMetadata);

			await repo.deleteContentMetadata(contentMetadata);

			const findById = repo.findById(contentMetadata.contentId);
			await expect(findById).rejects.toThrow();
		});
	});

	describe('getAllMetadata', () => {
		it('should return all metadata', async () => {
			const contentMetadatas = contentMetadataFactory.buildList(10);
			await em.persistAndFlush(contentMetadatas);

			const results = await repo.getAllMetadata();

			expect(results).toHaveLength(10);
			expect(results.sort(cmSortFunction)).toStrictEqual(contentMetadatas.sort(cmSortFunction));
		});
	});
});
