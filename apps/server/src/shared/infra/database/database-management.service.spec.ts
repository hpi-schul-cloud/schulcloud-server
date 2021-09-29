import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../../modules/database';
import { User } from '../../../entities';
import { DatabaseManagementService } from './database-management.service';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let service: DatabaseManagementService;
	let em: EntityManager;
	const allCollections = [
		'_teaminviteduserschemas',
		'_teamuserschemas',
		'accounts',
		'activations',
		'analytics',
		'base64files',
		'classes',
		'consents',
		'consents_history',
		'consentversions',
		'coursegroups',
		'courses',
		'directories',
		'federalstates',
		'files',
		'gradelevels',
		'grades',
		'helpdocuments',
		'homeworks',
		'keys',
		'lessons',
		'links',
		'ltitools',
		'materials',
		'migrations',
		'news',
		'newshistories',
		'passwordRecovery',
		'passwordrecoveries',
		'problems',
		'pseudonyms',
		'registrationpins',
		'rocketchatchannels',
		'rocketchatusers',
		'roles',
		'schools',
		'storageproviders',
		'submissions',
		'systems',
		'teams',
		'trashbins',
		'users',
		'users_history',
		'videoconferences',
		'webuntismetadatas',
		'years',
	];

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
		beforeAll(async () => {
			await service.seed();
		});
		it('should persist all database collections', async () => {
			const collections = await service.export();
			expect(collections).toContainEqual(allCollections);
		});
		it('should persist all database collections when define empty filter', async () => {
			const collections = await service.export([]);
			expect(collections).toContainEqual(allCollections);
		});
		it('should persist a database collection when it exists', async () => {
			const collections = await service.export(['roles']);
			expect(collections).toContainEqual(['roles']);
		});
		it('should fail when persist a database collection which does not exist', () => {
			expect(async () => {
				await service.export(['non_existing_collection']);
			}).toThrow();
		});
	});

	describe('When import some collections from filesystem', () => {
		it('should seed all collections from filesystem', async () => {
			const collections = await service.seed();
			expect(collections).toContainEqual(allCollections);
		});
		it('should seed all collections from filesystem for empty filter', async () => {
			const collections = await service.seed([]);
			expect(collections).toContainEqual(allCollections);
		});
		it('should seed a database collection when it exists', async () => {
			const collections = await service.seed(['roles']);
			expect(collections).toContainEqual('roles');
		});
		it('should fail when seed a database collection which does not exist', () => {
			expect(async () => {
				await service.seed(['non_existing_collection']);
			}).toThrow();
		});
	});
});
