import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import {
	courseNewsFactory,
	courseUnpublishedNewsFactory,
	schoolNewsFactory,
	schoolUnpublishedNewsFactory,
	teamNewsFactory,
	teamUnpublishedNewsFactory,
} from '@modules/news/testing';
import { TeamEntity } from '@modules/team/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { NewsTargetModel } from '../domain';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { NewsRepo } from './news.repo';
import { courseEntityFactory } from '@modules/course/testing';
import { teamFactory } from '@modules/team/testing/team.factory';
import { schoolEntityFactory } from '@modules/school/testing';

describe('NewsRepo', () => {
	let repo: NewsRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [News, TeamEntity, CourseEntity, CourseGroupEntity, CourseNews, SchoolNews, TeamNews],
				}),
			],
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

			await em.persist(news).flush();
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

			await em.persist(news).flush();
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
			await em.persist(news).flush();
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

			await em.persist(news).flush();
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

			await em.persist(news).flush();
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
			await em.persist(news).flush();
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
			await em.persist(news).flush();
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
			await em.persist(news).flush();
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
			await em.persist(news).flush();
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
			const course = courseEntityFactory.build();
			await em.persist(course).flush();

			const newsList = courseNewsFactory.buildList(5, { target: course.id });
			await em.persist(newsList).flush();
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
			await em.persist(news).flush();
			em.clear();

			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [news.target.id],
			};
			const pagination = { skip: 0, limit: 20 };
			const creatorId = news.creator?.id as string;

			const [result, count] = await repo.findAllUnpublishedByUser([target], creatorId, { pagination });

			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return unpublished news for school', async () => {
			const news = schoolUnpublishedNewsFactory.build();
			await em.persist(news).flush();
			em.clear();

			const pagination = { skip: 0, limit: 20 };
			const target = {
				targetModel: NewsTargetModel.School,
				targetIds: [news.target.id],
			};
			const creatorId = news.creator?.id as string;
			const [result, count] = await repo.findAllUnpublishedByUser([target], creatorId, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return unpublished news for given target', async () => {
			const news = courseUnpublishedNewsFactory.build();
			await em.persist(news).flush();
			em.clear();

			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [news.target.id],
			};
			const creatorId = news.creator?.id as string;
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAllUnpublishedByUser([target], creatorId, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return unpublished news in requested order', async () => {
			const creator = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId();
			await em.persist([creator, course]).flush();

			const newsList = courseUnpublishedNewsFactory.buildListWithId(5, { creator, target: course.id });
			await em.persist(newsList).flush();
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

		it('should populate target on all target types', async () => {
			const school = schoolEntityFactory.build();
			const schoolNews = schoolNewsFactory.build({ target: school });
			const team = teamFactory.build();
			const teamNews = teamNewsFactory.build({ target: team });

			await em.persist([school, team, schoolNews, teamNews]).flush();
			em.clear();

			const teamTarget = {
				targetModel: NewsTargetModel.Team,
				targetIds: [teamNews.target.id],
			};
			const schoolTarget = {
				targetModel: NewsTargetModel.School,
				targetIds: [schoolNews.target.id],
			};

			const [result] = await repo.findAllPublished([teamTarget, schoolTarget]);

			expect(result.every((news) => news.target != null)).toBe(true);
		});
	});

	describe('findOneById', () => {
		it('should find a news entity by id', async () => {
			const news = teamNewsFactory.build();
			await em.persist(news).flush();
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

	describe('findByCreatorOrUpdaterId', () => {
		const setup = async () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const news1 = teamNewsFactory.build({
				creator: user1,
			});
			const news2 = teamNewsFactory.build({
				updater: user2,
			});
			const news3 = teamNewsFactory.build({
				updater: user1,
			});

			await em.persist([news1, news2, news3]).flush();
			em.clear();

			return { news1, news2, news3, user1, user2 };
		};
		it('should find a news entity by creatorId and updaterId', async () => {
			const { news1, user1, news3 } = await setup();

			const result = await repo.findByCreatorOrUpdaterId(user1.id);
			expect(result).toBeDefined();
			expect(result[0][0].id).toEqual(news1.id);
			expect(result[0][1].id).toEqual(news3.id);
			expect(result[0].length).toEqual(2);
		});

		it('should find a news entity by updaterId', async () => {
			const { user2, news2 } = await setup();

			const result = await repo.findByCreatorOrUpdaterId(user2.id);
			expect(result).toBeDefined();
			expect(result[0][0].id).toEqual(news2.id);
			expect(result[0].length).toEqual(1);
		});

		it('should throw an exception if not found', async () => {
			const failNewsId = new ObjectId().toString();
			const result = await repo.findByCreatorOrUpdaterId(failNewsId);
			expect(result[1]).toEqual(0);
		});
	});

	describe('removeUserReference', () => {
		describe('when user is creator of news', () => {
			const setup = async () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.build();

				const news1 = teamNewsFactory.build({
					creator: user1,
				});
				const news2 = teamNewsFactory.build({
					creator: user2,
					updater: user1,
				});
				const news3 = teamNewsFactory.build({
					creator: user1,
					updater: user2,
				});

				await em.persist([user1, user2, news1, news2, news3]).flush();
				em.clear();

				return {
					user1,
					user2,
					news1,
					news2,
					news3,
				};
			};

			it('should actually remove the user reference from the news', async () => {
				const { user1, news1, news3 } = await setup();

				await repo.removeUserReference(user1.id);

				const result1 = await repo.findById(news1.id);
				expect(result1.creator).toBeUndefined();

				const result3 = await repo.findById(news3.id);
				expect(result3.creator).toBeUndefined();

				const result = await repo.findByCreatorOrUpdaterId(user1.id);
				expect(result[1]).toEqual(0);
				expect(result[0].length).toEqual(0);
			});

			it('should not remove the other user updater from same news item', async () => {
				const { user1, user2, news3 } = await setup();
				await repo.removeUserReference(user1.id);

				const result = await repo.findById(news3.id);
				expect(result.updater?.id).toEqual(user2.id);
			});
		});

		describe('when user is updater of news', () => {
			const setup = async () => {
				const user1 = userFactory.build();
				const user2 = userFactory.build();
				const news1 = teamNewsFactory.build({
					creator: user1,
				});
				const news2 = teamNewsFactory.build({
					updater: user2,
				});
				const news3 = teamNewsFactory.build({
					creator: user1,
					updater: user2,
				});

				await em.persist([news1, news2, news3]).flush();
				em.clear();

				return {
					user1,
					user2,
					news1,
					news2,
					news3,
				};
			};

			it('should actually remove the user reference from the news', async () => {
				const { user2, news2 } = await setup();

				await repo.removeUserReference(user2.id);

				const result2 = await repo.findById(news2.id);
				expect(result2.updater).toBeUndefined();

				const result = await repo.findByCreatorOrUpdaterId(user2.id);
				expect(result[1]).toEqual(0);
				expect(result[0].length).toEqual(0);
			});

			it('should not remove the other user creator from same news item', async () => {
				const { user1, user2, news3 } = await setup();
				await repo.removeUserReference(user2.id);

				const result = await repo.findById(news3.id);
				expect(result.creator?.id).toEqual(user1.id);
			});
		});
	});
});
