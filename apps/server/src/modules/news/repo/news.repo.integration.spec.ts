import * as moment from 'moment';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import {
	CourseNews,
	News,
	NewsTargetModel,
	NewsTargetModelValue,
	SchoolInfo,
	SchoolNews,
	TeamNews,
	UserInfo,
	CourseInfo,
	TeamInfo,
} from '../entity';
import { NewsRepo } from './news.repo';

describe('NewsService', () => {
	let repo: NewsRepo;
	let orm: MikroORM;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [News, CourseNews, CourseInfo, SchoolNews, SchoolInfo, TeamNews, TeamInfo, UserInfo],
				}),
			],
			providers: [NewsRepo],
		}).compile();

		repo = module.get(NewsRepo);
		orm = module.get(MikroORM);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(News, {});
	});

	afterAll(async () => {
		await orm.close();
		await MongoMemoryDatabaseModule.stopServer();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	const newTestNews = (
		schoolId: EntityId,
		targetModel: NewsTargetModelValue,
		targetId: EntityId,
		unpublished = false
	): News => {
		const displayAt = unpublished ? moment().add(1, 'days').toDate() : moment().subtract(1, 'days').toDate();
		const news = News.createInstance(targetModel, {
			school: schoolId,
			title: 'test course news',
			content: 'content',
			target: targetId,

			displayAt,
			creator: new ObjectId().toString(),
		});
		return news;
	};

	const createTestNews = async (
		schoolId: string,
		targetModel: NewsTargetModelValue,
		targetId: EntityId,
		unpublished = false
	) => {
		const news = newTestNews(schoolId, targetModel, targetId, unpublished);
		await em.persistAndFlush(news);
		return news;
	};

	const schoolId = new ObjectId().toString();

	describe('findAll', () => {
		it('should return news for targets', async () => {
			const courseId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Course, courseId);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseId],
			};
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAll([target], false, pagination);
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news for school', async () => {
			const news = await createTestNews(schoolId, NewsTargetModel.School, schoolId);
			const pagination = { skip: 0, limit: 20 };
			const target = {
				targetModel: NewsTargetModel.School,
				targetIds: [schoolId],
			};
			const [result, count] = await repo.findAll([target], false, pagination);
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news for given target', async () => {
			const courseId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Course, courseId);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseId],
			};
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAll([target], false, pagination);
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});
	});

	describe('create', () => {
		it('should create and persist a news entity', async () => {
			const courseId = new ObjectId().toString();
			const news = newTestNews(schoolId, NewsTargetModel.Course, courseId);
			await repo.save(news);
			expect(news.id).toBeDefined();
			const expectedNews = await em.findOne(News, news.id);
			expect(news).toStrictEqual(expectedNews);
		});
	});

	describe('findOneById', () => {
		it('should find a news entity by id', async () => {
			const teamId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Team, teamId);
			const result = await repo.findOneById(news.id);
			expect(result).toStrictEqual(news);
		});

		it('should throw an exception if not found', async () => {
			const failNewsId = new ObjectId().toString();
			await expect(repo.findOneById(failNewsId)).rejects.toThrow(NotFoundError);
		});
	});
});
