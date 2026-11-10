import { EntityManager } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain/interface';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ReleaseEntity } from '../entity';
import { ReleasesRepo } from './releases.repo';

describe(ReleasesRepo.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: ReleasesRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ReleaseEntity], ensureIndexes: true })],
			providers: [ReleasesRepo],
		}).compile();

		repo = module.get(ReleasesRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(ReleaseEntity, {});
		em.clear();
	});

	const buildRelease = (name: string, publishedAt: Date, githubId = publishedAt.getTime()): ReleaseEntity =>
		new ReleaseEntity({
			githubId,
			name,
			url: `https://example.com/${name}`,
			author: 'JohnDoe',
			authorUrl: 'https://example.com/JohnDoe',
			publishedAt,
		});

	const setup = async () => {
		const oldest = buildRelease('oldest', new Date('2024-01-01T00:00:00Z'));
		const middle = buildRelease('middle', new Date('2024-02-01T00:00:00Z'));
		const newest = buildRelease('newest', new Date('2024-03-01T00:00:00Z'));
		await em.persist([middle, oldest, newest]).flush();
		em.clear();

		return { oldest, middle, newest };
	};

	it('should return the entity name', () => {
		expect(repo.entityName).toBe(ReleaseEntity);
	});

	describe('findReleases', () => {
		describe('when no options are given', () => {
			it('should return all releases sorted by publishedAt desc with the total count', async () => {
				await setup();

				const [releases, count] = await repo.findReleases();

				expect(count).toBe(3);
				expect(releases.map((release) => release.name)).toEqual(['newest', 'middle', 'oldest']);
			});
		});

		describe('when pagination is given', () => {
			it('should apply skip and limit but return the total count', async () => {
				await setup();

				const [releases, count] = await repo.findReleases({ pagination: { skip: 1, limit: 1 } });

				expect(count).toBe(3);
				expect(releases.map((release) => release.name)).toEqual(['middle']);
			});
		});

		describe('when an order is given', () => {
			it('should override the default order', async () => {
				await setup();

				const [releases] = await repo.findReleases({ order: { publishedAt: SortOrder.asc } });

				expect(releases.map((release) => release.name)).toEqual(['oldest', 'middle', 'newest']);
			});
		});
	});

	describe('upsertByGithubId', () => {
		const olderSync = new Date('2024-06-01T10:00:00Z');
		const newerSync = new Date('2024-06-01T11:00:00Z');

		describe('when no release with the github id exists', () => {
			it('should insert the release', async () => {
				const release = buildRelease('new', new Date('2024-01-01T00:00:00Z'), 1);
				release.imageIds = ['imageId'];

				await repo.upsertByGithubId(release, newerSync);
				em.clear();

				const stored = await em.findOneOrFail(ReleaseEntity, { githubId: 1 });
				expect(stored).toEqual(expect.objectContaining({ name: 'new', imageIds: ['imageId'], syncedAt: newerSync }));
			});
		});

		describe('when a release with the github id exists', () => {
			it('should update it instead of creating a duplicate', async () => {
				const existing = buildRelease('old name', new Date('2024-01-01T00:00:00Z'), 1);
				await em.persist(existing).flush();
				em.clear();

				await repo.upsertByGithubId(buildRelease('new name', new Date('2024-01-01T00:00:00Z'), 1), olderSync);
				await repo.upsertByGithubId(buildRelease('new name', new Date('2024-01-01T00:00:00Z'), 1), olderSync);
				em.clear();

				const releases = await em.find(ReleaseEntity, {});
				expect(releases).toHaveLength(1);
				expect(releases[0]).toEqual(
					expect.objectContaining({ id: existing.id, name: 'new name', syncedAt: olderSync })
				);
			});
		});

		describe('when the release was written by a newer refresh', () => {
			it('should not overwrite it', async () => {
				await repo.upsertByGithubId(buildRelease('newer', new Date('2024-01-01T00:00:00Z'), 1), newerSync);

				await repo.upsertByGithubId(buildRelease('stale', new Date('2024-01-01T00:00:00Z'), 1), olderSync);
				em.clear();

				const releases = await em.find(ReleaseEntity, {});
				expect(releases).toHaveLength(1);
				expect(releases[0]).toEqual(expect.objectContaining({ name: 'newer', syncedAt: newerSync }));
			});
		});

		describe('when the release was written by an older refresh', () => {
			it('should overwrite it', async () => {
				await repo.upsertByGithubId(buildRelease('older', new Date('2024-01-01T00:00:00Z'), 1), olderSync);

				await repo.upsertByGithubId(buildRelease('newer', new Date('2024-01-01T00:00:00Z'), 1), newerSync);
				em.clear();

				const releases = await em.find(ReleaseEntity, {});
				expect(releases).toHaveLength(1);
				expect(releases[0]).toEqual(expect.objectContaining({ name: 'newer', syncedAt: newerSync }));
			});
		});

		describe('when an unexpected error occurs', () => {
			it('should rethrow it', async () => {
				const error = new Error('db error');
				jest.spyOn(em, 'getCollection').mockReturnValueOnce({
					updateOne: jest.fn().mockRejectedValueOnce(error),
				} as never);

				await expect(
					repo.upsertByGithubId(buildRelease('new', new Date('2024-01-01T00:00:00Z'), 1), newerSync)
				).rejects.toThrow(error);
			});
		});
	});

	describe('deleteAllExceptGithubIds', () => {
		it('should delete all releases with other or no github id', async () => {
			const { middle } = await setup();
			await em.getCollection('releases').insertOne({ _id: '42', name: 'legacy release without githubId' } as never);

			const deletedCount = await repo.deleteAllExceptGithubIds([middle.githubId], new Date());

			const remaining = await em.find(ReleaseEntity, {});
			expect(deletedCount).toBe(3);
			expect(remaining.map((release) => release.name)).toEqual(['middle']);
		});

		describe('when a stale refresh finishes after a newer one', () => {
			it('should not delete the releases written by the newer refresh', async () => {
				const staleSync = new Date('2024-06-01T10:00:00Z');
				const newerSync = new Date('2024-06-01T11:00:00Z');
				// the stale refresh only knew release 1, the newer one also saved the meanwhile published release 2
				await repo.upsertByGithubId(buildRelease('first', new Date('2024-01-01T00:00:00Z'), 1), newerSync);
				await repo.upsertByGithubId(buildRelease('second', new Date('2024-02-01T00:00:00Z'), 2), newerSync);
				await repo.upsertByGithubId(buildRelease('first', new Date('2024-01-01T00:00:00Z'), 1), staleSync);

				const deletedCount = await repo.deleteAllExceptGithubIds([1], staleSync);
				em.clear();

				const remaining = await em.find(ReleaseEntity, {}, { orderBy: { githubId: 'asc' } });
				expect(deletedCount).toBe(0);
				expect(remaining.map((release) => release.name)).toEqual(['first', 'second']);
			});
		});
	});

	describe('findAllImageIds', () => {
		it('should return the distinct image ids of all releases', async () => {
			const first = buildRelease('first', new Date('2024-01-01T00:00:00Z'));
			first.imageIds = ['a', 'b'];
			const second = buildRelease('second', new Date('2024-02-01T00:00:00Z'));
			second.imageIds = ['b', 'c'];
			const third = buildRelease('third', new Date('2024-03-01T00:00:00Z'));
			await em.persist([first, second, third]).flush();
			em.clear();

			const result = await repo.findAllImageIds();

			expect(result.sort()).toEqual(['a', 'b', 'c']);
		});
	});
});
