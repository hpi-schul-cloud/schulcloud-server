import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MikroORM } from '@mikro-orm/core';
import moment from 'moment';
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

	const createTestNews = async (schoolId: string, targetModel?: string, target?: string) => {
		const news = em.create(News, {
			school: schoolId,
			title: 'test course news',
			content: 'content',
			target,
			targetModel,
			displayAt: moment().subtract(1, 'days').toDate(),
		});
		await em.persistAndFlush(news);
		return news;
	};

	describe('findAll', () => {
		it('should return news for targets', async () => {
			const schoolId = new ObjectId().toString();
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
			const schoolId = new ObjectId().toString();
			const news = await createTestNews(schoolId);
			const pagination = { skip: 0, limit: 20 };
			const result = await repo.findAllBySchool(schoolId, false, pagination);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});
	});

	describe('findAllByTarget', () => {
		it('should return news for given target', async () => {
			const schoolId = new ObjectId().toString();
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
	});
});
