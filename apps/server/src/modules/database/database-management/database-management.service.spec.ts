import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Long, serialize, deserialize } from 'bson';
import { MongoMemoryDatabaseModule } from '..';
import { User } from '../../../entities';
import { ManagementService } from './database-management.service';

describe.only('MongoConsoleService', () => {
	let module: TestingModule;
	let service: ManagementService;
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
			providers: [ManagementService],
		}).compile();
		em = module.get<EntityManager>(EntityManager);
		service = module.get<ManagementService>(ManagementService);
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
			const droppedCollections = await service.dropAllCollections();
			expect(droppedCollections).toContain('users');
			em.clear();
			const entityNotFoundFromPersistence = await em.findOne<User>(User.name, { _id: sampleEntity._id });
			expect(entityNotFoundFromPersistence).toBe(null);
		});
	});

	it('when loading bson as json', () => {
		// Serialize a document
		const doc = { long: Long.fromNumber(100) };
		const data = serialize(doc);
		console.log('data:', data);

		// De serialize it again
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const doc2 = deserialize(data);
		console.log('doc_2:', doc2);
	});
});
