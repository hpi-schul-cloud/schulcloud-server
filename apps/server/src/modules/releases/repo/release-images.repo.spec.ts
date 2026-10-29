import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { NotFoundError } from '@mikro-orm/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ReleaseImageEntity } from '../entity';
import { ReleaseImagesRepo } from './release-images.repo';

describe(ReleaseImagesRepo.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: ReleaseImagesRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ReleaseImageEntity] })],
			providers: [ReleaseImagesRepo],
		}).compile();

		repo = module.get(ReleaseImagesRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(ReleaseImageEntity, {});
		em.clear();
	});

	const buildImage = (sourceUrl: string): ReleaseImageEntity =>
		new ReleaseImageEntity({ data: Buffer.from([1, 2, 3]), mimeType: 'image/png', sourceUrl });

	it('should return the entity name', () => {
		expect(repo.entityName).toBe(ReleaseImageEntity);
	});

	describe('findImageById', () => {
		describe('when the image exists', () => {
			it('should return the image including its binary data', async () => {
				const image = buildImage('https://example.com/a.png');
				await em.persist(image).flush();
				em.clear();

				const result = await repo.findImageById(image.id);

				expect(result.id).toBe(image.id);
				expect(result.mimeType).toBe('image/png');
				expect(result.size).toBe(3);
				expect(Buffer.compare(Buffer.from(result.data), Buffer.from([1, 2, 3]))).toBe(0);
			});
		});

		describe('when the image does not exist', () => {
			it('should throw a NotFoundError', async () => {
				await expect(repo.findImageById(new ObjectId().toHexString())).rejects.toThrow(NotFoundError);
			});
		});
	});

	describe('findImageIdBySourceUrl', () => {
		describe('when an image with the source url exists', () => {
			it('should return its id', async () => {
				const image = buildImage('https://example.com/a.png');
				await em.persist([image, buildImage('https://example.com/b.png')]).flush();
				em.clear();

				const result = await repo.findImageIdBySourceUrl('https://example.com/a.png');

				expect(result).toBe(image.id);
			});
		});

		describe('when no image with the source url exists', () => {
			it('should return null', async () => {
				const result = await repo.findImageIdBySourceUrl('https://example.com/unknown.png');

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteAllExcept', () => {
		describe('when ids to keep are given', () => {
			it('should delete all other images', async () => {
				const keep = buildImage('https://example.com/keep.png');
				const remove1 = buildImage('https://example.com/remove1.png');
				const remove2 = buildImage('https://example.com/remove2.png');
				await em.persist([keep, remove1, remove2]).flush();
				em.clear();

				const deletedCount = await repo.deleteAllExcept([keep.id]);

				const remaining = await em.find(ReleaseImageEntity, {});
				expect(deletedCount).toBe(2);
				expect(remaining.map((image) => image.id)).toEqual([keep.id]);
			});
		});

		describe('when no ids to keep are given', () => {
			it('should delete all images', async () => {
				await em.persist([buildImage('https://example.com/a.png'), buildImage('https://example.com/b.png')]).flush();
				em.clear();

				const deletedCount = await repo.deleteAllExcept([]);

				expect(deletedCount).toBe(2);
				expect(await em.count(ReleaseImageEntity, {})).toBe(0);
			});
		});
	});
});
