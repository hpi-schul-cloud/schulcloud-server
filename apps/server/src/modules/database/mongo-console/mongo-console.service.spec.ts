import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '..';
import { User } from '../../../entities';
import { MongoConsoleService } from './mongo-console.service';

describe('MongoConsoleService', () => {
	let module: TestingModule;
	let service: MongoConsoleService;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						// sample entity used for start the module
						User,
					],
				}),
			],
			providers: [MongoConsoleService],
		}).compile();
		em = module.get<EntityManager>(EntityManager);
		service = module.get<MongoConsoleService>(MongoConsoleService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When dropping all collections', () => {
		it('should have removed all persisted users', async () => {
			const sampleEntity = new User({
				firstName: 'FirstName',
				lastName: 'LastName',
				email: 'user@domain.tld',
				school: '123',
			});
			await em.persistAndFlush(sampleEntity);
			em.clear();
			const entityFoundFromPersistence = await em.findOne<User>(User.name, { _id: sampleEntity._id });
			expect(entityFoundFromPersistence).not.toBe(null);
			expect((entityFoundFromPersistence as User).school).toBe('123');
			const droppedCollections = await service.dropCollections();
			expect(droppedCollections).toContain('users');
			em.clear();
			const entityNotFoundFromPersistence = await em.findOne<User>(User.name, { _id: sampleEntity._id });
			expect(entityNotFoundFromPersistence).toBe(null);
		});
	});
});
