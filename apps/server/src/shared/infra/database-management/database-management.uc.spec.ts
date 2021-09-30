import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../../modules/database';
import { User } from '../../../entities';
import { DatabaseManagementUc } from './database-management.uc';
import { FileSystemModule } from '../file-system/file-system.module';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let service: DatabaseManagementUc;
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
				FileSystemModule,
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						// sample entity used for start and test the module
						// TODO loop through all entities when have autodiscover enabled
						User,
					],
				}),
			],
			providers: [DatabaseManagementUc],
		}).compile();
		em = module.get<EntityManager>(EntityManager);
		service = module.get<DatabaseManagementUc>(DatabaseManagementUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When export some collections to file system', () => {
		beforeAll(async () => {
			await service.seedDatabaseCollectionsFromFileSystem();
		});
		it('should persist all database collections', async () => {
			const collections = await service.exportCollectionsToFileSystem();
			expect(collections).toContainEqual(allCollections);
		});
		it('should persist all database collections when define empty filter', async () => {
			const collections = await service.exportCollectionsToFileSystem([]);
			expect(collections).toContainEqual(allCollections);
		});
		it('should persist a database collection when it exists', async () => {
			const collections = await service.exportCollectionsToFileSystem(['roles']);
			expect(collections).toContainEqual(['roles']);
		});
		it('should fail when persist a database collection which does not exist', () => {
			expect(async () => {
				await service.exportCollectionsToFileSystem(['non_existing_collection']);
			}).toThrow();
		});
	});

	describe('When import some collections from filesystem', () => {
		it('should seed all collections from filesystem', async () => {
			const collections = await service.seedDatabaseCollectionsFromFileSystem();
			expect(collections).toContainEqual(allCollections);
		});
		it('should seed all collections from filesystem for empty filter', async () => {
			const collections = await service.seedDatabaseCollectionsFromFileSystem([]);
			expect(collections).toContainEqual(allCollections);
		});
		it('should seed a database collection when it exists', async () => {
			const collections = await service.seedDatabaseCollectionsFromFileSystem(['roles']);
			expect(collections).toContainEqual('roles');
		});
		it('should fail when seed a database collection which does not exist', () => {
			expect(async () => {
				await service.seedDatabaseCollectionsFromFileSystem(['non_existing_collection']);
			}).toThrow();
		});
	});
});
