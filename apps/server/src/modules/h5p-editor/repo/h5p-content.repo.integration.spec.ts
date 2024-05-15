import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections, h5pContentFactory } from '@shared/testing/factory';
import { H5PContent } from '../entity';
import { H5PContentRepo } from './h5p-content.repo';

const contentSortFunction = ({ id: aId }: H5PContent, { id: bId }: H5PContent) => aId.localeCompare(bId);

describe('ContentRepo', () => {
	let module: TestingModule;
	let repo: H5PContentRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [H5PContent] })],
			providers: [H5PContentRepo],
		}).compile();

		repo = module.get(H5PContentRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(H5PContent);
	});

	describe('createContentMetadata', () => {
		it('should be able to retrieve entity', async () => {
			const h5pContent = h5pContentFactory.build();
			await em.persistAndFlush(h5pContent);

			const result = await repo.findById(h5pContent.id);

			expect(result).toBeDefined();
			expect(result).toEqual(h5pContent);
		});
	});

	describe('findById', () => {
		it('should be able to retrieve entity', async () => {
			const h5pContent = h5pContentFactory.build();
			await em.persistAndFlush(h5pContent);

			const result = await repo.findById(h5pContent.id);

			expect(result).toBeDefined();
			expect(result).toEqual(h5pContent);
		});

		it('should fail if entity does not exist', async () => {
			const id = 'wrong-id';

			const findById = repo.findById(id);

			await expect(findById).rejects.toThrow();
		});
	});

	describe('existsOne', () => {
		it('should return true if entity exists', async () => {
			const h5pContent = h5pContentFactory.build();
			await em.persistAndFlush(h5pContent);

			const result = await repo.existsOne(h5pContent.id);

			expect(result).toBeDefined();
			expect(result).toBeTruthy();
		});
	});

	describe('deleteContent', () => {
		it('should delete data', async () => {
			const h5pContent = h5pContentFactory.build();
			await em.persistAndFlush(h5pContent);

			await repo.deleteContent(h5pContent);

			const findById = repo.findById(h5pContent.id);
			await expect(findById).rejects.toThrow();
		});
	});

	describe('getAllContents', () => {
		it('should return all metadata', async () => {
			const h5pContent = h5pContentFactory.buildList(10);
			await em.persistAndFlush(h5pContent);

			const results = await repo.getAllContents();

			expect(results).toHaveLength(10);
			expect(results.sort(contentSortFunction)).toStrictEqual(h5pContent.sort(contentSortFunction));
		});
	});
});
