import { EntityManager, MikroORM, Options } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { News, SchoolInfo, UserInfo } from '../entity';
import { NewsRepo } from './news.repo';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('NewsRepoService', () => {
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

	// NOTE don't forget to call orm.close() here
	// https://stackoverflow.com/questions/62033627/how-to-tear-down-mikroorm-in-nestjs
	// https://github.com/dario1985/nestjs-mikro-orm/issues/10
	afterAll(async () => {
		await orm.close();
		await mongod.stop();
	});

	it('repo should be defined', () => {
		expect(repo).toBeDefined();
	});

	it('entity manager should be defined', () => {
		expect(em).toBeDefined();
	});
});
