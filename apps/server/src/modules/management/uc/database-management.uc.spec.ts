import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemAdapter } from '@shared/infra/file-system';
import { DatabaseManagementService } from '@shared/infra/database';
import { ConfigService } from '@nestjs/config';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { System } from '@shared/domain';
import { ObjectId } from 'mongodb';
import { DatabaseManagementUc } from './database-management.uc';
import { BsonConverter } from '../converter/bson.converter';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let uc: DatabaseManagementUc;
	let fileSystemAdapter: DeepMocked<FileSystemAdapter>;
	let dbService: DeepMocked<DatabaseManagementService>;
	let configService: DeepMocked<ConfigService>;
	let encryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let bsonConverter: BsonConverter;
	const systemsCollectionName = 'systems';
	const collectionNames = ['collectionName1', 'collectionName2', systemsCollectionName];
	const oauthSystem = {
		_id: {
			$oid: '0000d186816abba584714c93',
		},
		alias: 'SANIS',
		type: 'oauthSanis',
		__v: 0,
		oauthConfig: {
			clientId: 'SANIS_CLIENT_ID',
			clientSecret: 'SANIS_CLIENT_SECRET',
		},
	};
	const oauthSystemWithSecrets = {
		_id: {
			$oid: '0000d186816abba584714c93',
		},
		alias: 'SANIS',
		type: 'oauthSanis',
		__v: 0,
		oauthConfig: {
			clientId: 'encryptedClientId',
			clientSecret: 'encryptedClientSecret',
		},
	};

	const oidcSystem = {
		_id: {
			$oid: '62c7f233f35a554ba3ed42f1',
		},
		__v: 0,
		updatedAt: {
			$date: '2022-07-12T14:01:58.588Z',
		},
		type: 'oidc',
		alias: 'iserv',
		config: {
			clientId: 'ISERV_CLIENT_ID',
			clientSecret: 'ISERV_CLIENT_SECRET',
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
		alias: 'iserv',
		config: {
			clientId: 'encryptedClientId',
			clientSecret: 'encryptedClientSecret',
		},
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DatabaseManagementUc,
				BsonConverter,
				{ provide: ConfigService, useValue: createMock<ConfigService>() },
				{ provide: SymetricKeyEncryptionService, useValue: createMock<SymetricKeyEncryptionService>() },
				{
					provide: FileSystemAdapter,
					useValue: createMock<FileSystemAdapter>({
						joinPath(_basePath: string, ...paths: string[]) {
							// skip variable basePath, take filename only without / or \
							const adapter = new FileSystemAdapter();
							return adapter.joinPath(...paths);
						},
						readDir: () => {
							// expect json files in folder
							return Promise.resolve(collectionNames.map((name) => `${name}.json`));
						},
						readFile: jest.fn().mockImplementation((fileName: string) => {
							if (fileName === 'collectionName1.json') {
								return '[{"foo":"bar1"},{"foo":"bar2"}]';
							}
							if (fileName === 'collectionName2.json') {
								return '[{"foo":"bar1"},{"foo":"bar2"}]';
							}
							if (fileName === `${systemsCollectionName}.json`) {
								return JSON.stringify([oauthSystem, oidcSystem]);
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
							if (collectionName === 'collectionName1') {
								return Promise.resolve([{ first: 'foo1' }, { first: 'bar1' }]);
							}
							if (collectionName === 'collectionName2') {
								return Promise.resolve([{ first: 'foo2' }]);
							}
							if (collectionName === systemsCollectionName) {
								// JSON used for cloning, so that oauthSystemWithSecrets' values can't be changed
								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
								return Promise.resolve(JSON.parse(JSON.stringify([oauthSystemWithSecrets, oidcSystemWithSecrets])));
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
		configService = module.get(ConfigService);
		encryptionService = module.get(SymetricKeyEncryptionService);
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
		"first": "bar1"
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
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:1', 'systems:2']);
			expect(fileSystemAdapter.writeFile).toBeCalledTimes(3);
			expect(fileSystemAdapter.writeFile).toBeCalledWith(...collection1Export);
			expect(fileSystemAdapter.writeFile).toBeCalledWith(...collection2Export);
		});
		it('should persist all database collections for empty filter', async () => {
			const collections = await uc.exportCollectionsToFileSystem([]);
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:1', 'systems:2']);
			expect(fileSystemAdapter.writeFile).toBeCalledTimes(3);
			expect(fileSystemAdapter.writeFile).toBeCalledWith(...collection1Export);
			expect(fileSystemAdapter.writeFile).toBeCalledWith(...collection2Export);
		});
		it('should persist a given database collection when it exists', async () => {
			const collections = await uc.exportCollectionsToFileSystem(['collectionName1']);
			expect(collections).toEqual(['collectionName1:2']);
			expect(fileSystemAdapter.writeFile).toBeCalledTimes(1);
			expect(fileSystemAdapter.writeFile).toBeCalledWith(...collection1Export);
		});
		it('should fail when persist a database collection which does not exist', async () => {
			await expect(async () => {
				await uc.exportCollectionsToFileSystem(['non_existing_collection']);
			}).rejects.toThrow();
		});
		it('should return names and document counts', async () => {
			const collections1 = await uc.exportCollectionsToFileSystem(['collectionName1']);
			expect(collections1).toEqual(['collectionName1:2']);
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
				expect(fileSystemAdapter.writeFile).toBeCalledTimes(1);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
				expect(fileSystemAdapter.writeFile).toBeCalledTimes(1);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const arg: unknown = fileSystemAdapter.writeFile.mock.calls[0][1];
				expect(arg).toEqual(expect.stringMatching(/<EOL>$/));
			});
			it('should use <collectionName>.json as filename', async () => {
				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapter.writeFile).toBeCalledTimes(1);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const arg: unknown = fileSystemAdapter.writeFile.mock.calls[0][0];
				expect(arg).toEqual('collectionName1.json');
			});

			describe('for systems', () => {
				it('should replace secrets with placeholders', async () => {
					await uc.exportCollectionsToFileSystem([systemsCollectionName]);
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					const fileName: unknown = fileSystemAdapter.writeFile.mock.calls[0][0];
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
					const fileContent: string = fileSystemAdapter.writeFile.mock.calls[0][1];
					expect(fileName).toEqual(`${systemsCollectionName}.json`);
					expect(fileContent.includes(oauthSystemWithSecrets.oauthConfig.clientId)).toBe(false);
					expect(fileContent.includes(oauthSystemWithSecrets.oauthConfig.clientSecret)).toBe(false);
					expect(fileContent.includes(oidcSystemWithSecrets.config.clientSecret)).toBe(false);
					expect(fileContent.includes(oidcSystemWithSecrets.config.clientSecret)).toBe(false);

					expect(fileContent.includes(oauthSystem.oauthConfig.clientId)).toBe(true);
					expect(fileContent.includes(oauthSystem.oauthConfig.clientSecret)).toBe(true);
					expect(fileContent.includes(oidcSystem.config.clientSecret)).toBe(true);
					expect(fileContent.includes(oidcSystem.config.clientSecret)).toBe(true);
				});
			});
		});
	});

	describe('When import some collections from filesystem', () => {
		it('should seed all collections from filesystem and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem();
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:2', 'systems:2']);
		});
		it('should seed all collections from filesystem for empty filter and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem([]);
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:2', 'systems:2']);
		});
		it('should seed a given database collection when it exists and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem(['collectionName1']);
			expect(collections).toEqual(['collectionName1:2']);
		});
		it('should fail when seed a database collection which does not exist', async () => {
			await expect(async () => {
				await uc.seedDatabaseCollectionsFromFileSystem(['non_existing_collection']);
			}).rejects.toThrow();
		});

		describe('When import a collection', () => {
			const collectionName = 'collectionName1';

			afterEach(() => {
				configService.get.mockReset();
				encryptionService.encrypt.mockReset();
			});
			it('should clear existing collection if documents already exists', async () => {
				dbService.collectionExists.mockReturnValue(Promise.resolve(true));
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(dbService.collectionExists).toBeCalledTimes(1);
				expect(dbService.clearCollection).toBeCalledWith(collectionName);
				expect(dbService.createCollection).not.toBeCalled();
			});
			it('should create new collection if collection does not exist', async () => {
				dbService.collectionExists.mockReturnValue(Promise.resolve(false));
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(dbService.collectionExists).toBeCalledTimes(1);
				expect(dbService.createCollection).toBeCalledWith(collectionName);
				expect(dbService.clearCollection).not.toBeCalled();
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
				expect(fileSystemAdapter.readFile).toBeCalledWith(`${collectionName}.json`);
				expect(fileSystemAdapter.readFile).toBeCalledTimes(1);
				const args = dbService.importCollection.mock.calls[0];
				expect(dbService.importCollection).toBeCalledTimes(1);
				expect(args[0]).toEqual(collectionName);
				expect(JSON.stringify(args[1])).toEqual(
					'[{"_id":"100000000000000000000000","createdAt":"2021-10-04T11:04:45.593Z"}]'
				);
			});
			describe('when importing systems', () => {
				it('should not encrypt secrets if no AES key is available', async () => {
					configService.get.mockReturnValue(null);
					dbService.collectionExists.mockReturnValue(Promise.resolve(false));
					await uc.seedDatabaseCollectionsFromFileSystem([systemsCollectionName]);
					expect(dbService.collectionExists).toBeCalledTimes(1);
					expect(dbService.createCollection).toBeCalledWith(systemsCollectionName);
					expect(dbService.clearCollection).not.toBeCalled();
					const importedSystems = dbService.importCollection.mock.calls[0][1];
					expect((importedSystems[0] as System).oauthConfig).toMatchObject({
						clientId: 'SANIS_CLIENT_ID',
						clientSecret: 'SANIS_CLIENT_SECRET',
					});
					expect((importedSystems[1] as System).config).toMatchObject({
						clientId: 'ISERV_CLIENT_ID',
						clientSecret: 'ISERV_CLIENT_SECRET',
					});
				});
				it('should encrypt secrets if AES key is available', async () => {
					configService.get.mockImplementation((data) => data);
					encryptionService.encrypt.mockImplementation((data) => `${data}_encrypted`);
					dbService.collectionExists.mockReturnValue(Promise.resolve(false));
					await uc.seedDatabaseCollectionsFromFileSystem([systemsCollectionName]);
					expect(dbService.collectionExists).toBeCalledTimes(1);
					expect(dbService.createCollection).toBeCalledWith(systemsCollectionName);
					expect(dbService.clearCollection).not.toBeCalled();
					const importedSystems = dbService.importCollection.mock.calls[0][1];
					expect((importedSystems[0] as System).oauthConfig).toMatchObject({
						clientId: 'SANIS_CLIENT_ID_encrypted',
						clientSecret: 'SANIS_CLIENT_SECRET_encrypted',
					});
					expect((importedSystems[1] as System).config).toMatchObject({
						clientId: 'ISERV_CLIENT_ID_encrypted',
						clientSecret: 'ISERV_CLIENT_SECRET_encrypted',
					});
				});
			});
		});
	});
	describe('DatabaseManagementService', () => {
		it('should call syncIndexes()', async () => {
			dbService.syncIndexes = jest.fn();
			await uc.syncIndexes();
			expect(dbService.syncIndexes).toHaveBeenCalled();
		});
	});
});
