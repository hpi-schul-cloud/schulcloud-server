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
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [ReleaseEntity] })],
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

	const buildRelease = (name: string, publishedAt: Date): ReleaseEntity =>
		new ReleaseEntity({
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

	describe('deleteAll', () => {
		it('should delete all releases', async () => {
			await setup();

			await repo.deleteAll();

			const count = await em.count(ReleaseEntity, {});
			expect(count).toBe(0);
		});
	});
});
