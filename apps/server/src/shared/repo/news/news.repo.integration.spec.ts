import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { News, NewsTargetModel, SortOrder } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	courseNewsFactory,
	schoolNewsFactory,
	teamNewsFactory,
	cleanupCollections,
	courseUnpublishedNewsFactory,
	schoolUnpublishedNewsFactory,
	teamUnpublishedNewsFactory,
	userFactory,
} from '@shared/testing';
import { NewsRepo } from './news.repo';

describe('NewsRepo', () => {
	let repo: NewsRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [NewsRepo],
		}).compile();

		repo = module.get(NewsRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(News);
		});
	});

	// TODO: Die folgenden Tests testen keine Repo-Methoden, sondern nur den EntityManager. Können die entfernt werden?
	describe('entity persistence', () => {
		it('should persist course news', async () => {
			const news = courseNewsFactory.build();

			await em.persistAndFlush(news);
			em.clear();

			const result = await em.findOneOrFail(News, {
				targetModel: NewsTargetModel.Course,
				target: news.target.id,
			});
			expect(result).toBeDefined();
			expect(result.targetModel).toEqual(news.targetModel);
			expect(result.target.id).toEqual(news.target.id);
		});

		it('should persist team news', async () => {
			const news = teamNewsFactory.build();

			await em.persistAndFlush(news);
			em.clear();

			const result = await em.findOneOrFail(News, {
				targetModel: NewsTargetModel.Team,
				target: news.target.id,
			});
			expect(result).toBeDefined();
			expect(result.targetModel).toEqual(news.targetModel);
			expect(result.target.id).toEqual(news.target.id);
		});

		it('should persist school news', async () => {
			const news = schoolNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const result = await em.findOneOrFail(News, {
				targetModel: NewsTargetModel.School,
				target: news.target.id,
			});
			expect(result).toBeDefined();
			expect(result.targetModel).toEqual(news.targetModel);
			expect(result.target.id).toEqual(news.target.id);
		});
		it('should persist unpublished course news', async () => {
			const news = courseUnpublishedNewsFactory.build();

			await em.persistAndFlush(news);
			em.clear();

			const result = await em.findOneOrFail(News, {
				targetModel: NewsTargetModel.Course,
				target: news.target.id,
			});
			expect(result).toBeDefined();
			expect(result.targetModel).toEqual(news.targetModel);
			expect(result.target.id).toEqual(news.target.id);
		});

		it('should persist unpublished team news', async () => {
			const news = teamUnpublishedNewsFactory.build();

			await em.persistAndFlush(news);
			em.clear();

			const result = await em.findOneOrFail(News, {
				targetModel: NewsTargetModel.Team,
				target: news.target.id,
			});
			expect(result).toBeDefined();
			expect(result.targetModel).toEqual(news.targetModel);
			expect(result.target.id).toEqual(news.target.id);
		});

		it('should persist unpublished school news', async () => {
			const news = schoolUnpublishedNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const result = await em.findOneOrFail(News, {
				targetModel: NewsTargetModel.School,
				target: news.target.id,
			});
			expect(result).toBeDefined();
			expect(result.targetModel).toEqual(news.targetModel);
			expect(result.target.id).toEqual(news.target.id);
		});
	});

	describe('findAll', () => {
		it('should return news for targets', async () => {
			const news = courseNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [news.target.id],
			};
			const pagination = { skip: 0, limit: 20 };

			const [result, count] = await repo.findAllPublished([target], { pagination });

			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news for school', async () => {
			const news = schoolNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const pagination = { skip: 0, limit: 20 };
			const target = {
				targetModel: NewsTargetModel.School,
				targetIds: [news.target.id],
			};
			const [result, count] = await repo.findAllPublished([target], { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news for given target', async () => {
			const news = courseNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [news.target.id],
			};
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAllPublished([target], { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news in requested order', async () => {
			const newsList = courseNewsFactory.buildList(5);
			await em.persistAndFlush(newsList);
			em.clear();

			const courseIds = newsList.map((o) => o.target.id);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: courseIds,
			};
			const [result, count] = await repo.findAllPublished([target], { order: { target: SortOrder.desc } });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(courseIds.length);
			const resultCourseIds = result.map((news) => news.target.id);
			const reverseCourseIds = courseIds.sort((r1, r2) => (r1 > r2 ? -1 : 1));
			expect(resultCourseIds).toEqual(reverseCourseIds);
		});

		it('should return unpublished news for targets', async () => {
			const news = courseUnpublishedNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [news.target.id],
			};
			const pagination = { skip: 0, limit: 20 };

			const [result, count] = await repo.findAllUnpublishedByUser([target], news.creator.id, { pagination });

			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return unpublished news for school', async () => {
			const news = schoolUnpublishedNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const pagination = { skip: 0, limit: 20 };
			const target = {
				targetModel: NewsTargetModel.School,
				targetIds: [news.target.id],
			};
			const [result, count] = await repo.findAllUnpublishedByUser([target], news.creator.id, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return unpublished news for given target', async () => {
			const news = courseUnpublishedNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [news.target.id],
			};
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAllUnpublishedByUser([target], news.creator.id, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return unpublished news in requested order', async () => {
			const creator = userFactory.build();
			const newsList = courseUnpublishedNewsFactory.buildList(5, { creator });
			await em.persistAndFlush(newsList);
			em.clear();

			const courseIds = newsList.map((o) => o.target.id);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: courseIds,
			};
			const [result, count] = await repo.findAllUnpublishedByUser([target], creator.id, {
				order: { target: SortOrder.desc },
			});
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(courseIds.length);
			const resultCourseIds = result.map((news) => news.target.id);
			const reverseCourseIds = courseIds.sort((r1, r2) => (r1 > r2 ? -1 : 1));
			expect(resultCourseIds).toEqual(reverseCourseIds);
		});
	});

	describe('findOneById', () => {
		it('should find a news entity by id', async () => {
			const news = teamNewsFactory.build();
			await em.persistAndFlush(news);
			em.clear();

			const result = await repo.findOneById(news.id);
			expect(result).toBeDefined();
			expect(result.id).toEqual(news.id);
		});

		it('should throw an exception if not found', async () => {
			const failNewsId = new ObjectId().toString();
			await expect(repo.findOneById(failNewsId)).rejects.toThrow(NotFoundError);
		});
	});
});
