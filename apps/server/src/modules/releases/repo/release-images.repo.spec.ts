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

	describe('markImageUsed', () => {
		describe('when an image with the source url exists', () => {
			it('should refresh lastUsedAt and return its id', async () => {
				const image = buildImage('https://example.com/a.png');
				image.lastUsedAt = new Date('2024-01-01T00:00:00Z');
				const other = buildImage('https://example.com/b.png');
				other.lastUsedAt = new Date('2024-01-01T00:00:00Z');
				await em.persist([image, other]).flush();
				em.clear();
				const usedAt = new Date('2024-06-01T00:00:00Z');

				const result = await repo.markImageUsed('https://example.com/a.png', usedAt);

				expect(result).toBe(image.id);
				const [updated, untouched] = await em.find(ReleaseImageEntity, {}, { orderBy: { sourceUrl: 'asc' } });
				expect(updated.lastUsedAt).toEqual(usedAt);
				expect(untouched.lastUsedAt).toEqual(new Date('2024-01-01T00:00:00Z'));
			});
		});

		describe('when no image with the source url exists', () => {
			it('should return null', async () => {
				const result = await repo.markImageUsed('https://example.com/unknown.png');

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteUnusedImages', () => {
		const setup = async () => {
			const unusedSince = new Date('2024-06-01T00:00:00Z');
			const buildImageUsedAt = (name: string, lastUsedAt: Date): ReleaseImageEntity => {
				const image = buildImage(`https://example.com/${name}.png`);
				image.lastUsedAt = lastUsedAt;

				return image;
			};
			const keptOld = buildImageUsedAt('kept-old', new Date('2024-01-01T00:00:00Z'));
			const unreferencedOld = buildImageUsedAt('unreferenced-old', new Date('2024-01-01T00:00:00Z'));
			const unreferencedRecent = buildImageUsedAt('unreferenced-recent', new Date('2024-07-01T00:00:00Z'));
			await em.persist([keptOld, unreferencedOld, unreferencedRecent]).flush();
			em.clear();

			return { unusedSince, keptOld, unreferencedRecent };
		};

		it('should delete only unreferenced images that were not used since the given date', async () => {
			const { unusedSince, keptOld, unreferencedRecent } = await setup();

			const deletedCount = await repo.deleteUnusedImages([keptOld.id], unusedSince);

			const remaining = await em.find(ReleaseImageEntity, {});
			expect(deletedCount).toBe(1);
			expect(remaining.map((image) => image.id).sort()).toEqual([keptOld.id, unreferencedRecent.id].sort());
		});
	});
});
