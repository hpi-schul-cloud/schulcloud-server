import * as moment from 'moment';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { News, NewsTargetModel, SchoolInfo, UserInfo } from '../entity';
import { NewsRepo } from './news.repo';

describe('NewsService', () => {
	let repo: NewsRepo;
	let mongod: MongoMemoryServer;
	let orm: MikroORM;
	let em: EntityManager;

	beforeAll(async () => {
		mongod = new MongoMemoryServer();
		const dbUrl = await mongod.getUri();
		const module: TestingModule = await Test.createTestingModule({
			imports: [MikroOrmModule.forRoot({ type: 'mongo', clientUrl: dbUrl, entities: [News, SchoolInfo, UserInfo] })],
			providers: [NewsRepo],
		}).compile();

		repo = module.get<NewsRepo>(NewsRepo);
		orm = module.get<MikroORM>(MikroORM);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await orm.close();
		await mongod.stop();
	});

	const newTestNews = (schoolId: EntityId, targetModel?: string, target?: EntityId, unpublished = false): News => {
		const displayAt = unpublished ? moment().add(1, 'days').toDate() : moment().subtract(1, 'days').toDate();
		const news = em.create(News, {
			school: schoolId,
			title: 'test course news',
			content: 'content',
			target,
			targetModel,
			displayAt,
			creator: new ObjectId().toString(),
		});
		return news;
	};

	const createTestNews = async (schoolId: string, targetModel?: string, target?: EntityId) => {
		const news = newTestNews(schoolId, targetModel, target);
		await em.persistAndFlush(news);
		return news;
	};

	const schoolId = new ObjectId().toString();

	describe('findAll', () => {
		it('should return news for targets', async () => {
			const courseId = new ObjectId().toString();
			const news = await createTestNews(schoolId, 'courses', courseId);
			const targets = [
				{
					targetModel: NewsTargetModel.Course,
					targetIds: [courseId],
				},
			];
			const pagination = { skip: 0, limit: 20 };
			const result = await repo.findAll(schoolId, targets, false, pagination);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});
	});

	describe('findAllBySchool', () => {
		it('should return news for school', async () => {
			const news = await createTestNews(schoolId);
			const pagination = { skip: 0, limit: 20 };
			const result = await repo.findAllBySchool(schoolId, false, pagination);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});
	});

	describe('findAllByTarget', () => {
		it('should return news for given target', async () => {
			const courseId = new ObjectId().toString();
			const news = await createTestNews(schoolId, 'courses', courseId);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseId],
			};
			const pagination = { skip: 0, limit: 20 };
			const result = await repo.findAllByTarget(schoolId, target, false, pagination);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		describe('create', () => {
			it('should create and persist a news entity', async () => {
				const courseId = new ObjectId().toString();
				const props = newTestNews(schoolId, 'courses', courseId);
				const result = await repo.create(props);
				expect(result).toBeDefined();
				expect(result.id).toBeDefined();
				const expectedNews = await em.findOne(News, result.id);
				expect(result).toStrictEqual(expectedNews);
			});
		});

		describe('findOneById', () => {
			it('should find a news entity by id', async () => {
				const news = await createTestNews(schoolId);
				const result = await repo.findOneById(news.id);
				expect(result).toStrictEqual(news);
			});

			it('should throw an exception if not found', async () => {
				const failNewsId = new ObjectId().toString();
				await expect(repo.findOneById(failNewsId)).rejects.toThrow(NotFoundError);
			});
		});
	});
});
