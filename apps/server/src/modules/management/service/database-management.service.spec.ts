import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IMigrator, MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { createCollections } from '@testing/create-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { TEST_ENTITIES } from '../management.entity.imports';
import { DatabaseManagementService } from './database-management.service';

const randomChars = () => new ObjectId().toHexString();
describe('DatabaseManagementService', () => {
	let service: DatabaseManagementService;
	let module: TestingModule;
	let orm: MikroORM;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES })],
			providers: [DatabaseManagementService],
		}).compile();

		service = module.get(DatabaseManagementService);
		orm = module.get(MikroORM);

		const em = module.get(EntityManager);
		await createCollections(em);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When create collections', () => {
		/* this test no longer works with MongoDB 7.0
		  TODO - try again when mongo driver is upgraded
		it('should succeed for new collection and fail for existing', async () => {
			const random = randomChars();
			// create collection twice, second should fail
			const response = await service.createCollection(random);
			await expect(async () => service.createCollection(random)).rejects.toThrow();
		});
		 */
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
		/* this test no longer works with MongoDB 7.0
			 TODO - try again when mongo driver is upgraded
		it('should fail for collection that does not exist', async () => {
			const random = randomChars();
			await expect(async () => service.dropCollection(random)).rejects.toThrow();
		});
		 */
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

	describe('When call migrationUp()', () => {
		const setup = () => {
			jest.spyOn(orm.getMigrator(), 'up').mockImplementation();
		};
		it('should call migrator.up()', async () => {
			setup();
			await service.migrationUp();
			expect(orm.getMigrator().up).toHaveBeenCalled();
		});
		it('should call migrator.up() with from', async () => {
			setup();
			const params = { from: 'foo' };
			await service.migrationUp(params.from, undefined, undefined);
			expect(orm.getMigrator().up).toHaveBeenCalledWith(params);
		});
		it('should call migrator.up() with param "to"', async () => {
			setup();
			const params = { to: 'foo' };
			await service.migrationUp(undefined, params.to, undefined);
			expect(orm.getMigrator().up).toHaveBeenCalledWith(params);
		});
		it('should call migrator.up() with param "only"', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationUp(undefined, undefined, params.only);
			expect(orm.getMigrator().up).toHaveBeenCalledWith({ migrations: [params.only] });
		});
		it('should call migrator.up() with param "only" and ignore from and to', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationUp('bar', 'baz', params.only);
			expect(orm.getMigrator().up).toHaveBeenCalledWith({ migrations: [params.only] });
		});
	});

	describe('When call migrationDown()', () => {
		const setup = () => {
			jest.spyOn(orm.getMigrator(), 'down').mockImplementation();
		};
		it('should call migrator.down()', async () => {
			setup();
			await service.migrationDown();
			expect(orm.getMigrator().down).toHaveBeenCalled();
		});
		it('should call migrator.down() with from', async () => {
			setup();
			const params = { from: 'foo' };
			await service.migrationDown(params.from, undefined, undefined);
			expect(orm.getMigrator().down).toHaveBeenCalledWith(params);
		});
		it('should call migrator.down() with param "to"', async () => {
			setup();
			const params = { to: 'foo' };
			await service.migrationDown(undefined, params.to, undefined);
			expect(orm.getMigrator().down).toHaveBeenCalledWith(params);
		});
		it('should call migrator.down() with param "only"', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationDown(undefined, undefined, params.only);
			expect(orm.getMigrator().down).toHaveBeenCalledWith({ migrations: [params.only] });
		});
		it('should call migrator.down() with param "only" and ignore from and to', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationDown('bar', 'baz', params.only);
			expect(orm.getMigrator().down).toHaveBeenCalledWith({ migrations: [params.only] });
		});
	});

	describe('When call migrationPending()', () => {
		it('should call migrator.getPendingMigrations()', async () => {
			const spy = jest.spyOn(orm.getMigrator(), 'getPendingMigrations');
			await service.migrationPending();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('When call migrationCreate()', () => {
		it('should call migrator.createInitialMigration()', async () => {
			const spyGetMigrator = jest.spyOn(orm, 'getMigrator');
			const spyMigrator: DeepMocked<IMigrator> = createMock<IMigrator>();
			spyGetMigrator.mockReturnValue(spyMigrator);

			await service.migrationCreate();
			expect(spyMigrator.createInitialMigration).toHaveBeenCalled();
		});
	});
});
