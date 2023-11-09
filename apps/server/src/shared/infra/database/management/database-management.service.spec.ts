import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ObjectId } from 'mongodb';
import { DatabaseManagementService } from './database-management.service';

const randomChars = () => new ObjectId().toHexString();
describe('DatabaseManagementService', () => {
	let service: DatabaseManagementService;
	let module: TestingModule;
	let orm: MikroORM;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [DatabaseManagementService],
		}).compile();

		service = module.get(DatabaseManagementService);
		orm = module.get(MikroORM);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When create collections', () => {
		it('should succeed for new collection and fail for existing', async () => {
			const random = randomChars();
			// create collection twice, second should fail
			await service.createCollection(random);
			await expect(async () => service.createCollection(random)).rejects.toThrow();
		});
		it('should exist after creation with same name', async () => {
			const random = randomChars();
			let exists = await service.collectionExists(random);
			expect(exists).toEqual(false);
			await service.createCollection(random);
			exists = await service.collectionExists(random);
			expect(exists).toEqual(true);
			const collectionNames = await service.getCollectionNames();
			expect(collectionNames).toContain(random);
		});
	});

	describe('When delete a collection', () => {
		it('should fail for collection that does not exist', async () => {
			const random = randomChars();
			await expect(async () => service.dropCollection(random)).rejects.toThrow();
		});
		it('should drop existing collection', async () => {
			const random = randomChars();
			await service.createCollection(random);
			let exists = await service.collectionExists(random);
			expect(exists).toEqual(true);
			await service.dropCollection(random);
			exists = await service.collectionExists(random);
			expect(exists).toEqual(false);
		});
	});

	describe('When persist data to a collection', () => {
		it('should find previously imported data', async () => {
			const random = randomChars();
			await service.createCollection(random);
			const sample = { _id: random, foo: 'bar' };
			await service.importCollection(random, [sample]);
			const foundDocuments = await service.findDocumentsOfCollection(random);
			expect(foundDocuments).toEqual(expect.arrayContaining([sample]));
		});
		it('should return "0" if jsonDocuments is empty', async () => {
			const random = randomChars();
			const res = await service.importCollection(random, []);
			expect(res).toEqual(0);
		});
	});

	describe('When call syncIndexes()', () => {
		it('should call getSchemaGenerator().ensureIndexes()', async () => {
			const spy = jest.spyOn(orm, 'getSchemaGenerator');
			await service.syncIndexes();
			expect(spy).toHaveBeenCalled();
		});
	});
});
