import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { h5pContentFactory, h5pEntityLibraryTestFactory } from '../testing';
import { H5PContent, InstalledLibrary } from './entity';
import { H5PContentRepo } from './h5p-content.repo';

describe('ContentRepo', () => {
	let module: TestingModule;
	let repo: H5PContentRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [H5PContent, InstalledLibrary] })],
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
			await em.persist(h5pContent).flush();

			const result = await repo.findById(h5pContent.id);

			expect(result).toBeDefined();
			expect(result).toEqual(h5pContent);
		});
	});

	describe('findById', () => {
		it('should be able to retrieve entity', async () => {
			const h5pContent = h5pContentFactory.build();
			await em.persist(h5pContent).flush();

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
			await em.persist(h5pContent).flush();

			const result = await repo.existsOne(h5pContent.id);

			expect(result).toBeDefined();
			expect(result).toBeTruthy();
		});
	});

	describe('deleteContent', () => {
		it('should delete data', async () => {
			const h5pContent = h5pContentFactory.build();
			await em.persist(h5pContent).flush();

			await repo.deleteContent(h5pContent);

			const findById = repo.findById(h5pContent.id);
			await expect(findById).rejects.toThrow();
		});
	});

	describe('countUsage', () => {
		it('should return zero counts for non-used library', async () => {
			const library = h5pEntityLibraryTestFactory.build();

			const result = await repo.countUsage(library);

			expect(result).toEqual({ asMainLibrary: 0, asDependency: 0 });
		});

		it('should return correct counts for used main library', async () => {
			const library = h5pEntityLibraryTestFactory.build();
			const h5pContents = h5pContentFactory.withMainLibrary(library).buildList(2);
			await em.persist([...h5pContents, library]).flush();

			const result = await repo.countUsage(library);

			expect(result).toEqual({ asMainLibrary: 2, asDependency: 0 });
		});

		it('should return correct counts preloaded dependencies', async () => {
			const libaries = h5pEntityLibraryTestFactory.buildList(2);
			const h5pContents = h5pContentFactory.addPreloadedDependencies(libaries).buildList(2);
			await em.persist([...h5pContents, ...libaries]).flush();

			const result = await repo.countUsage(libaries[0]);

			expect(result).toEqual({ asMainLibrary: 0, asDependency: 2 });
		});

		it('should throw if unexpected structure returned', () => {
			const invalidResult = { invalidField: 123 };

			const repoWithPrivates = repo as unknown as {
				castToH5PCountUsageResult: (obj: unknown) => unknown;
			};

			expect(() => repoWithPrivates.castToH5PCountUsageResult(invalidResult)).toThrow(
				'Invalid dependency count result structure'
			);
		});
	});
});
