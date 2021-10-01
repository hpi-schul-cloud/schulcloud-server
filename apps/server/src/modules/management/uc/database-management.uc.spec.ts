import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { User } from '../../../entities';
import { DatabaseManagementUc } from './database-management.uc';
import { ManagementModule } from '../management.module';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let service: DatabaseManagementUc;
	const allCollectionsWithDocumentCounts = [
		'_teaminviteduserschemas:0',
		'_teamuserschemas:0',
		'accounts:63',
		'activations:0',
		'analytics:1',
		'base64files:0',
		'classes:3',
		'consents_history:1',
		'consents:2',
		'consentversions:3',
		'coursegroups:1',
		'courses:12',
		'datasourceruns:99',
		'datasources:28',
		'directories:1',
		'federalstates:17',
		'files:0',
		'gradelevels:13',
		'grades:0',
		'helpdocuments:5',
		'homeworks:50',
		'keys:1',
		'lessons:15',
		'links:28',
		'ltitools:2',
		'materials:2',
		'migrations:98',
		'news:0',
		'newshistories:1',
		'passwordrecoveries:0',
		'passwordRecovery:1',
		'problems:1',
		'pseudonyms:1',
		'registrationpins:54',
		'rocketchatchannels:1',
		'rocketchatusers:1',
		'roles:19',
		'schoolgroups:94',
		'schools:9',
		'storageproviders:0',
		'submissions:26',
		'systems:2',
		'teams:3',
		'trashbins:0',
		'users_history:292',
		'users:62',
		'videoconferences:0',
		'webuntismetadatas:1',
		'years:9',
	];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ManagementModule,
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						// sample entity used for start and test the module
						// TODO loop through all entities when have autodiscover enabled
						User,
					],
				}),
			],
		}).compile();
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
			expect(collections).toEqual(expect.arrayContaining(allCollectionsWithDocumentCounts));
		});
		it('should persist all database collections when define empty filter', async () => {
			const collections = await service.exportCollectionsToFileSystem([]);
			expect(collections).toEqual(expect.arrayContaining(allCollectionsWithDocumentCounts));
		});
		it('should persist a database collection when it exists', async () => {
			const collections = await service.exportCollectionsToFileSystem(['roles']);
			expect(collections).toEqual(allCollectionsWithDocumentCounts.filter((name) => name.startsWith('roles')));
		});
		it('should fail when persist a database collection which does not exist', async () => {
			await expect(async () => {
				await service.exportCollectionsToFileSystem(['non_existing_collection']);
			}).rejects.toThrow();
		});
	});

	describe('When import some collections from filesystem', () => {
		it('should seed all collections from filesystem', async () => {
			const collections = await service.seedDatabaseCollectionsFromFileSystem();
			expect(collections).toEqual(expect.arrayContaining(allCollectionsWithDocumentCounts));
		});
		it('should seed all collections from filesystem for empty filter', async () => {
			const collections = await service.seedDatabaseCollectionsFromFileSystem([]);
			expect(collections).toEqual(expect.arrayContaining(allCollectionsWithDocumentCounts));
		});
		it('should seed a database collection when it exists', async () => {
			const collections = await service.seedDatabaseCollectionsFromFileSystem(['roles']);
			expect(collections).toEqual(allCollectionsWithDocumentCounts.filter((name) => name.startsWith('roles')));
		});
		it('should fail when seed a database collection which does not exist', async () => {
			await expect(async () => {
				await service.seedDatabaseCollectionsFromFileSystem(['non_existing_collection']);
			}).rejects.toThrow();
		});
	});
});
