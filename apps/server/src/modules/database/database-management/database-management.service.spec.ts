import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '..';
import { User } from '../../../entities';
import { DatabaseManagementService } from './database-management.service';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let service: DatabaseManagementService;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						// sample entity used for start and test the module
						// TODO loop through all entities when have autodiscover enabled
						User,
					],
				}),
			],
			providers: [DatabaseManagementService],
		}).compile();
		em = module.get<EntityManager>(EntityManager);
		service = module.get<DatabaseManagementService>(DatabaseManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When export some collections to file system', () => {
		it('should persist all database collections', () => {});
		it('should persist a database collection when it exists', () => {});
		it('should fail when persist a database collection which does not exist', () => {});
	});

	describe('When import some collections from filesystem', () => {
		it('should seed all collections from filesystem', () => {});
		it('should seed a database collection when it exists', () => {});
		it('should fail when seed a database collection which does not exist', () => {});
	});
});
