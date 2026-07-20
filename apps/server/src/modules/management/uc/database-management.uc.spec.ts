import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, type SymmetricKeyEncryptionService } from '@infra/encryption';
import { FileSystemAdapter } from '@infra/file-system';
import { LegacyLogger } from '@infra/logger';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { Role } from '@modules/role/repo';
import { SchoolEntity, type StorageProviderEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BsonConverter } from '../converter/bson.converter';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN } from '../management-seed-data.config';
import { generateSeedData } from '../seed-data/generate-seed-data';
import {
	ExternalToolsSeedDataService,
	InstancesSeedDataService,
	MediaSourcesSeedDataService,
	SystemsSeedDataService,
} from '../service';
import { DatabaseManagementService } from '../service/database-management.service';
import { DatabaseManagementUc } from './database-management.uc';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let uc: DatabaseManagementUc;

	let fileSystemAdapter: DeepMocked<FileSystemAdapter>;
	let dbService: DeepMocked<DatabaseManagementService>;
	let mediaSourcesSeedDataService: DeepMocked<MediaSourcesSeedDataService>;
	let systemsSeedDataService: DeepMocked<SystemsSeedDataService>;
	let externalToolsSeedDataService: DeepMocked<ExternalToolsSeedDataService>;
	let instancesSeedDataService: DeepMocked<InstancesSeedDataService>;

	let bsonConverter: BsonConverter;
	const systemsCollectionName = 'systems';
	const storageprovidersCollectionName = 'storageproviders';
	const collectionNames = ['collectionName1', 'collectionName2', systemsCollectionName, storageprovidersCollectionName];
	const oauthSystem = {
		_id: {
			$oid: '0000d186816abba584714c93',
		},
		alias: 'moin.schule',
		type: 'oauth',
		__v: 0,
		oauthConfig: {
			clientId: '${SCHULCONNEX_CLIENT_ID}',

			clientSecret: '${SCHULCONNEX_CLIENT_SECRET}',
		},
	};
	const oauthSystemWithSecrets = {
		_id: {
			$oid: '0000d186816abba584714c93',
		},
		alias: 'moin.schule',
		type: 'oauth',
		__v: 0,
		oauthConfig: {
			clientId: 'ClientId',
			clientSecret: 'encryptedClientSecret',
		},
	};

	const oidcSystemWithSecrets = {
		_id: {
			$oid: '62c7f233f35a554ba3ed42f1',
		},
		__v: 0,
		updatedAt: {
			$date: '2022-07-12T14:01:58.588Z',
		},
		type: 'oidc',
		alias: 'oidc',
		oidcConfig: {
			clientId: 'ClientId',
			clientSecret: 'encryptedClientSecret',
		},
	};

	const ldapSystem = {
		_id: {
			$oid: '62c7f233f35a554ba3ed42f1',
		},
		__v: 0,
		updatedAt: {
			$date: '2022-07-12T14:01:58.588Z',
		},
		type: 'ldap',
		alias: 'ldap',
		ldapConfig: {
			searchUserPassword: 'encryptedSearchuserPassword',
		},
	};

	const storageProviderParsed: StorageProviderEntity[] = [
		{
			id: '62d6ca7e769952e3f6e67925',
			_id: new ObjectId('62d6ca7e769952e3f6e67925'),
			region: 'DoNotIgnore ${Ignore}',
			endpointUrl: 'https://storage-SC_DOMAIN',
			accessKeyId: 'someAccessKey',
			secretAccessKey: 'someSecretAccessKey',
			createdAt: new Date('2021-07-16T09:03:18.536Z'),
			updatedAt: new Date('2021-07-16T09:03:18.536Z'),
		},
	];

	const storageProviderJSON =
		'[{' +
		'"id": {' +
		'	"$oid": "62d6ca7e769952e3f6e67925"' +
		'},' +
		'"region": "${DoNotIgnore} \\${Ignore}",' +
		'"endpointUrl": "https://storage-${SC_DOMAIN}",' +
		'"accessKeyId": "bar",' +
		'"secretAccessKey": "foo",' +
		'"createdAt": {' +
		'	"$date": "2021-07-16T09:03:18.536Z"' +
		'},' +
		'"updatedAt": {' +
		'	"$date": "2021-07-16T09:03:18.536Z"' +
		'}' +
		'}]';

	const collection1Name = 'collectionName1';

	const collection1Data = [{ first: 'foo1' }, { second: 'bar1' }, { third: '${aVar}' }];

	const collection2Name = 'collectionName2';

	const collection2Data = [{ first: 'foo2' }];

	const defaultSecretReplacementHintText = 'replace with secret placeholder';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DatabaseManagementUc,
				BsonConverter,
				{ provide: DefaultEncryptionService, useValue: createMock<SymmetricKeyEncryptionService>() },
				{ provide: MANAGEMENT_SEED_DATA_CONFIG_TOKEN, useValue: {} },
				{ provide: LegacyLogger, useValue: createMock<LegacyLogger>() },
				{ provide: EntityManager, useValue: createMock<EntityManager>() },
				{ provide: MediaSourcesSeedDataService, useValue: createMock<MediaSourcesSeedDataService>() },
				{ provide: SystemsSeedDataService, useValue: createMock<SystemsSeedDataService>() },
				{ provide: ExternalToolsSeedDataService, useValue: createMock<ExternalToolsSeedDataService>() },
				{ provide: InstancesSeedDataService, useValue: createMock<InstancesSeedDataService>() },
				{
					provide: FileSystemAdapter,
					useValue: createMock<FileSystemAdapter>({
						joinPath(_basePath: string, ...paths: string[]) {
							// skip variable basePath, take filename only without / or \
							const adapter = new FileSystemAdapter();
							return adapter.joinPath(...paths);
						},
						readDir: () =>
							// expect json files in folder
							Promise.resolve(collectionNames.map((name) => `${name}.json`)),
						readFile: jest.fn().mockImplementation((fileName: string) => {
							if (fileName === `${collection1Name}.json`) {
								return JSON.stringify(collection1Data);
							}
							if (fileName === `${collection2Name}.json`) {
								return JSON.stringify(collection2Data);
							}
							if (fileName === `${systemsCollectionName}.json`) {
								return JSON.stringify([oauthSystem, ldapSystem]);
							}
							if (fileName === `${storageprovidersCollectionName}.json`) {
								return storageProviderJSON;
							}
							return '[]';
						}),
						get EOL() {
							return '<EOL>';
						},
					}),
				},
				{
					provide: DatabaseManagementService,
					useValue: createMock<DatabaseManagementService>({
						getCollectionNames() {
							// expect some names
							return Promise.resolve(collectionNames);
						},
						findDocumentsOfCollection(collectionName) {
							if (collectionName === collection1Name) {
								return Promise.resolve(collection1Data);
							}
							if (collectionName === collection2Name) {
								return Promise.resolve(collection2Data);
							}
							if (collectionName === systemsCollectionName) {
								// JSON used for cloning, so that oauthSystemWithSecrets' values can't be changed
								return Promise.resolve(
									JSON.parse(JSON.stringify([oauthSystemWithSecrets, oidcSystemWithSecrets, ldapSystem]))
								);
							}
							if (collectionName === storageprovidersCollectionName) {
								return Promise.resolve(storageProviderParsed);
							}
							return Promise.resolve([]);
						},
						collectionExists() {
							return Promise.resolve(true);
						},
						importCollection(_collectionName: string, jsonDocuments: unknown[]) {
							return Promise.resolve(jsonDocuments.length);
						},
					}),
				},
			],
		}).compile();
		uc = module.get(DatabaseManagementUc);
		fileSystemAdapter = module.get(FileSystemAdapter);
		dbService = module.get(DatabaseManagementService);
		bsonConverter = module.get(BsonConverter);
		mediaSourcesSeedDataService = module.get(MediaSourcesSeedDataService);
		systemsSeedDataService = module.get(SystemsSeedDataService);
		externalToolsSeedDataService = module.get(ExternalToolsSeedDataService);
		instancesSeedDataService = module.get(InstancesSeedDataService);
		await setupEntities([Role, SchoolEntity, SchoolSystemOptionsEntity, SystemEntity, UserLoginMigrationEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		fileSystemAdapter.writeFile.mockClear();
		fileSystemAdapter.readFile.mockClear();
		fileSystemAdapter.createDir.mockClear();

		dbService.collectionExists.mockClear();
		dbService.clearCollection.mockClear();
		dbService.createCollection.mockClear();
		dbService.clearCollection.mockClear();
		dbService.importCollection.mockClear();
	});

	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('When export some collections to file system', () => {
		const collection1Export = [
			'collectionName1.json',
			`[
	{
		"first": "foo1"
	},
	{
		"second": "bar1"
	},
	{
		"third": "\${aVar}"
	}
]<EOL>`,
		];
		const collection2Export = [
			'collectionName2.json',
			`[
	{
		"first": "foo2"
	}
]<EOL>`,
		];

		it('should persist all database collections for undefined filter', async () => {
			const collections = await uc.exportCollectionsToFileSystem();
			expect(collections).toEqual(['collectionName1:3', 'collectionName2:1', 'systems:3', 'storageproviders:1']);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledTimes(4);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledWith(...collection1Export);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledWith(...collection2Export);
		});
		it('should persist all database collections for empty filter', async () => {
			const collections = await uc.exportCollectionsToFileSystem([]);
			expect(collections).toEqual(['collectionName1:3', 'collectionName2:1', 'systems:3', 'storageproviders:1']);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledTimes(4);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledWith(...collection1Export);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledWith(...collection2Export);
		});
		it('should persist a given database collection when it exists', async () => {
			const collections = await uc.exportCollectionsToFileSystem(['collectionName1']);
			expect(collections).toEqual(['collectionName1:3']);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledTimes(1);
			expect(fileSystemAdapter.writeFile).toHaveBeenCalledWith(...collection1Export);
		});
		it('should fail when persist a database collection which does not exist', async () => {
			await expect(async () => {
				await uc.exportCollectionsToFileSystem(['non_existing_collection']);
			}).rejects.toThrow();
		});
		it('should return names and document counts', async () => {
			const collections1 = await uc.exportCollectionsToFileSystem(['collectionName1']);
			expect(collections1).toEqual(['collectionName1:3']);
			const collections2 = await uc.exportCollectionsToFileSystem(['collectionName2']);
			expect(collections2).toEqual(['collectionName2:1']);
		});
		it('should create export dir (based on current date time)', async () => {
			await uc.exportCollectionsToFileSystem(['collectionName1']);
			expect(fileSystemAdapter.createDir).toHaveBeenCalledTimes(1);
		});
		it('should override seed files in setup folder when override flag is set', async () => {
			await uc.exportCollectionsToFileSystem(['collectionName1'], true);
			expect(fileSystemAdapter.createDir).toHaveBeenCalledTimes(1);
			expect(fileSystemAdapter.createDir).toHaveBeenCalledWith(expect.stringContaining('setup'));
		});
		describe('When writing documents as text fo file', () => {
			it('should sort documents by age (id first, then createdAt) and convert to bson', async () => {
				const smallDate = new Date();
				const largerDate = new Date();
				const largerId = new ObjectId('110000000000000000000000');
				largerDate.setDate(smallDate.getDate() + 1);
				const expectedFirst = {
					_id: new ObjectId('100000000000000000000000'),
					createdAt: largerDate,
				};
				const expectedSecond = {
					_id: largerId,
					createdAt: smallDate,
				};
				const expectedLast = {
					_id: largerId,
					createdAt: largerDate,
				};
				dbService.findDocumentsOfCollection.mockResolvedValueOnce([expectedSecond, expectedLast, expectedFirst]);

				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapter.writeFile).toHaveBeenCalledTimes(1);

				const text: unknown = fileSystemAdapter.writeFile.mock.calls[0][1];
				const expectedResult = `${JSON.stringify(
					bsonConverter.serialize([expectedFirst, expectedSecond, expectedLast]),
					undefined,
					'\t'
				)}<EOL>`;
				expect(text).toEqual(expectedResult);
			});
			it('should add system EOL to end of text', async () => {
				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapter.writeFile).toHaveBeenCalledTimes(1);

				const arg: unknown = fileSystemAdapter.writeFile.mock.calls[0][1];
				expect(arg).toEqual(expect.stringMatching(/<EOL>$/));
			});
			it('should use <collectionName>.json as filename', async () => {
				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapter.writeFile).toHaveBeenCalledTimes(1);

				const arg: unknown = fileSystemAdapter.writeFile.mock.calls[0][0];
				expect(arg).toEqual('collectionName1.json');
			});
			describe('for systems', () => {
				it('should replace secrets with replacement hint', async () => {
					await uc.exportCollectionsToFileSystem([systemsCollectionName]);

					const fileName: unknown = fileSystemAdapter.writeFile.mock.calls[0][0];

					const fileContent: string = fileSystemAdapter.writeFile.mock.calls[0][1];
					expect(fileName).toEqual(`${systemsCollectionName}.json`);
					expect(fileContent.includes(oauthSystemWithSecrets.oauthConfig.clientSecret)).toBe(false);
					expect(fileContent.includes(oidcSystemWithSecrets.oidcConfig.clientSecret)).toBe(false);
					expect(fileContent.includes(oidcSystemWithSecrets.oidcConfig.clientSecret)).toBe(false);

					expect(fileContent.includes(defaultSecretReplacementHintText)).toBe(true);
				});
			});
			describe('for storageproviders', () => {
				it('should replace secrets with replacement hint', async () => {
					await uc.exportCollectionsToFileSystem([storageprovidersCollectionName]);

					const fileName: unknown = fileSystemAdapter.writeFile.mock.calls[0][0];

					const fileContent: string = fileSystemAdapter.writeFile.mock.calls[0][1];
					expect(fileName).toEqual(`${storageprovidersCollectionName}.json`);
					expect(fileContent.includes(oauthSystemWithSecrets.oauthConfig.clientSecret)).toBe(false);
					expect(fileContent.includes(oidcSystemWithSecrets.oidcConfig.clientSecret)).toBe(false);
					expect(fileContent.includes(oidcSystemWithSecrets.oidcConfig.clientSecret)).toBe(false);

					expect(fileContent.includes(defaultSecretReplacementHintText)).toBe(true);
				});
			});
		});
	});

	describe('When import some collections from filesystem', () => {
		beforeAll(() => {
			mediaSourcesSeedDataService.import.mockResolvedValue(1);
			systemsSeedDataService.import.mockResolvedValue(1);
			externalToolsSeedDataService.import.mockResolvedValue(1);
			instancesSeedDataService.import.mockResolvedValue(1);
		});

		it('should seed all collections from filesystem and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem();
			expect(collections).toEqual([
				'collectionName1:3',
				'collectionName2:1',
				'systems:3',
				'storageproviders:1',
				'media-sources:1',
				'external-tools:1',
				'instances:1',
			]);
		});
		it('should seed all collections from filesystem for empty filter and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem([]);
			expect(collections).toEqual(['collectionName1:3', 'collectionName2:1', 'systems:2', 'storageproviders:1']);
		});
		it('should seed a given database collection when it exists and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem(['collectionName1']);
			expect(collections).toEqual(['collectionName1:3']);
		});

		it('should fail when seed a database collection which does not exist', async () => {
			await expect(async () => {
				await uc.seedDatabaseCollectionsFromFileSystem(['non_existing_collection']);
			}).rejects.toThrow();
		});

		describe('When import a collection', () => {
			const collectionName = 'collectionName1';
			it('should clear existing collection if documents already exists', async () => {
				dbService.collectionExists.mockReturnValue(Promise.resolve(true));
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(dbService.collectionExists).toHaveBeenCalledTimes(1);
				expect(dbService.clearCollection).toHaveBeenCalledWith(collectionName);
				expect(dbService.createCollection).not.toHaveBeenCalled();
			});
			it('should create new collection if collection does not exist', async () => {
				dbService.collectionExists.mockReturnValue(Promise.resolve(false));
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(dbService.collectionExists).toHaveBeenCalledTimes(1);
				expect(dbService.createCollection).toHaveBeenCalledWith(collectionName);
				expect(dbService.clearCollection).not.toHaveBeenCalled();
			});
			it('should convert bson from file to json before db import', async () => {
				const smallDate = new Date('2021-10-04T11:04:45.593Z');
				const jsonDoc = {
					_id: new ObjectId('100000000000000000000000'),
					createdAt: smallDate,
				};
				const bsonDocsAsText = `${JSON.stringify(bsonConverter.serialize([jsonDoc]))}`;
				expect(bsonDocsAsText).toEqual(
					'[{"_id":{"$oid":"100000000000000000000000"},"createdAt":{"$date":"2021-10-04T11:04:45.593Z"}}]'
				);
				// const readFileMock = jest.spyOn(fileSystemAdapter, 'readFile').mockReturnValue(Promise.resolve(bsonDocsAsText));
				fileSystemAdapter.readFile.mockResolvedValueOnce(bsonDocsAsText);
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(fileSystemAdapter.readFile).toHaveBeenCalledWith(`${collectionName}.json`);
				expect(fileSystemAdapter.readFile).toHaveBeenCalledTimes(1);
				const args = dbService.importCollection.mock.calls[0];
				expect(dbService.importCollection).toHaveBeenCalledTimes(1);
				expect(args[0]).toEqual(collectionName);
				expect(JSON.stringify(args[1])).toEqual(
					'[{"_id":"100000000000000000000000","createdAt":"2021-10-04T11:04:45.593Z"}]'
				);
			});
		});
	});

	describe('DatabaseManagementService', () => {
		it('should call syncIndexes()', async () => {
			jest.spyOn(dbService, 'syncIndexes').mockImplementation();
			await uc.syncIndexes();
			expect(dbService.syncIndexes).toHaveBeenCalled();
		});
	});

	describe('when seeding database from factories', () => {
		it('should return correct number of seeded collections with length', async () => {
			const collectionsSeeded = await uc.seedDatabaseCollectionsFromFactories();

			const expectedCollectionsWithLength = generateSeedData((s) => uc['injectEnvVars'](s)).map(
				(c) => `${c.collectionName}:${c.data.length}`
			);
			expect(collectionsSeeded).toStrictEqual(expectedCollectionsWithLength);
		});

		it('should return correct number of filtered seeded collections', async () => {
			const filteredCollections = ['roles'];
			const collectionsSeeded = await uc.seedDatabaseCollectionsFromFactories(filteredCollections);

			const expectedCollectionsWithLength = generateSeedData((s) => uc['injectEnvVars'](s))
				.filter((d) => filteredCollections.includes(d.collectionName))
				.map((c) => `${c.collectionName}:${c.data.length}`);
			expect(collectionsSeeded).toStrictEqual(expectedCollectionsWithLength);
		});

		it('should call dropCollectionIfExists if collection is present', async () => {
			dbService.collectionExists.mockReturnValue(Promise.resolve(true));
			const collectionsSeeded = await uc.seedDatabaseCollectionsFromFactories();

			const expectedCollectionsWithLength = generateSeedData((s) => uc['injectEnvVars'](s)).map(
				(c) => `${c.collectionName}:${c.data.length}`
			);
			expect(collectionsSeeded).toStrictEqual(expectedCollectionsWithLength);
		});
	});

	describe('migration', () => {
		it('should call migrationUp', async () => {
			jest.spyOn(dbService, 'migrationUp').mockImplementation();
			await uc.migrationUp();
			expect(dbService.migrationUp).toHaveBeenCalled();
		});
		it('should call migrationUp with params', async () => {
			jest.spyOn(dbService, 'migrationUp').mockImplementation();
			await uc.migrationUp('foo', 'bar', 'baz');
			expect(dbService.migrationUp).toHaveBeenCalledWith('foo', 'bar', 'baz');
		});
		it('should call migrationDown', async () => {
			jest.spyOn(dbService, 'migrationDown').mockImplementation();
			await uc.migrationDown();
			expect(dbService.migrationDown).toHaveBeenCalled();
		});
		it('should call migrationDown with params', async () => {
			jest.spyOn(dbService, 'migrationDown').mockImplementation();
			await uc.migrationDown('foo', 'bar', 'baz');
			expect(dbService.migrationDown).toHaveBeenCalledWith('foo', 'bar', 'baz');
		});
		it('should call migrationPending', async () => {
			jest.spyOn(dbService, 'migrationDown').mockImplementation();
			await uc.migrationPending();
			expect(dbService.migrationPending).toHaveBeenCalled();
		});
		it('should call migrationCreate', async () => {
			jest.spyOn(dbService, 'migrationDown').mockImplementation();
			await uc.migrationCreate();
			expect(dbService.migrationCreate).toHaveBeenCalled();
		});
	});
});
