import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemAdapter } from '@shared/infra/file-system';
import { DatabaseManagementService } from '@shared/infra/database';
import { ObjectId } from 'mongodb';
import { DatabaseManagementUc } from './database-management.uc';
import { BsonConverter } from '../converter/bson.converter';

describe('DatabaseManagementService', () => {
	let module: TestingModule;
	let uc: DatabaseManagementUc;
	let fileSystemAdapter: FileSystemAdapter;
	let dbService: DatabaseManagementService;
	let bsonConverter: BsonConverter;
	const collectionNames = ['collectionName1', 'collectionName2'];
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DatabaseManagementUc,
				BsonConverter,
				{
					provide: FileSystemAdapter,
					useValue: {
						joinPath(_basePath: string, ...paths: string[]) {
							// skip variable basePath, take filename only without / or \
							const adapter = new FileSystemAdapter();
							return adapter.joinPath(...paths);
						},
						writeFileSync(_path: string, _text: string) {},
						readDirSync(_path: string) {
							// expect json files in folder
							return collectionNames.map((name) => `${name}.json`);
						},
						readFileSync(fileName: string) {
							if (fileName === 'collectionName1.json') {
								return '[{"foo":"bar1"},{"foo":"bar2"}]';
							}
							if (fileName === 'collectionName2.json') {
								return '[{"foo":"bar1"},{"foo":"bar2"}]';
							}
							return '[]';
						},
						get EOL() {
							return '<EOL>';
						},
					},
				},
				{
					provide: DatabaseManagementService,
					useValue: {
						getCollectionNames() {
							// expect some names
							return collectionNames;
						},
						findDocumentsOfCollection(collectionName) {
							if (collectionName === 'collectionName1') {
								return [{ first: 'foo1' }, { first: 'bar1' }];
							}
							if (collectionName === 'collectionName2') {
								return [{ first: 'foo2' }];
							}
							return [];
						},
						collectionExists() {
							return true;
						},
						clearCollection(_collectionName: string) {},
						createCollection(_collectionName: string) {},
						importCollection(_collectionName: string, jsonDocuments: unknown[]) {
							return jsonDocuments.length;
						},
					},
				},
			],
		}).compile();
		uc = module.get<DatabaseManagementUc>(DatabaseManagementUc);
		fileSystemAdapter = module.get<FileSystemAdapter>(FileSystemAdapter);
		dbService = module.get<DatabaseManagementService>(DatabaseManagementService);
		bsonConverter = module.get<BsonConverter>(BsonConverter);
	});

	afterAll(async () => {
		await module.close();
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
		let fileSystemAdapterMock: jest.SpyInstance;

		beforeEach(() => {
			fileSystemAdapterMock = jest.spyOn(fileSystemAdapter, 'writeFile');
		});
		afterEach(() => {
			fileSystemAdapterMock.mockReset();
		});

		it('should persist all database collections for undefined filter', async () => {
			const collections = await uc.exportCollectionsToFileSystem();
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:1']);
			expect(fileSystemAdapterMock).toBeCalledTimes(2);
			expect(fileSystemAdapterMock).toBeCalledWith(...collection1Export);
			expect(fileSystemAdapterMock).toBeCalledWith(...collection2Export);
		});
		it('should persist all database collections for empty filter', async () => {
			const collections = await uc.exportCollectionsToFileSystem([]);
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:1']);
			expect(fileSystemAdapterMock).toBeCalledTimes(2);
			expect(fileSystemAdapterMock).toBeCalledWith(...collection1Export);
			expect(fileSystemAdapterMock).toBeCalledWith(...collection2Export);
		});
		it('should persist a given database collection when it exists', async () => {
			const collections = await uc.exportCollectionsToFileSystem(['collectionName1']);
			expect(collections).toEqual(['collectionName1:2']);
			expect(fileSystemAdapterMock).toBeCalledTimes(1);
			expect(fileSystemAdapterMock).toBeCalledWith(...collection1Export);
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
				const dbMock = jest
					.spyOn(dbService, 'findDocumentsOfCollection')
					.mockReturnValue(Promise.resolve([expectedSecond, expectedLast, expectedFirst]));

				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapterMock).toBeCalledTimes(1);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const text: unknown = fileSystemAdapterMock.mock.calls[0][1];
				const expectedResult = `${JSON.stringify(
					bsonConverter.serialize([expectedFirst, expectedSecond, expectedLast]),
					undefined,
					'\t'
				)}<EOL>`;
				expect(text).toEqual(expectedResult);
				dbMock.mockReset();
			});
			it('should add system EOL to end of text', async () => {
				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapterMock).toBeCalledTimes(1);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const arg: unknown = fileSystemAdapterMock.mock.calls[0][1];
				expect(arg).toEqual(expect.stringMatching(/<EOL>$/));
			});
			it('should use <collectionName>.json as filename', async () => {
				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapterMock).toBeCalledTimes(1);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const arg: unknown = fileSystemAdapterMock.mock.calls[0][0];
				expect(arg).toEqual('collectionName1.json');
			});
		});
	});

	describe('When import some collections from filesystem', () => {
		it('should seed all collections from filesystem and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem();
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:2']);
		});
		it('should seed all collections from filesystem for empty filter and return collectionnames with document counts', async () => {
			const collections = await uc.seedDatabaseCollectionsFromFileSystem([]);
			expect(collections).toEqual(['collectionName1:2', 'collectionName2:2']);
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
			let collectionExistsMock: jest.SpyInstance;
			let clearCollectionMock: jest.SpyInstance;
			let createCollectionMock: jest.SpyInstance;
			beforeEach(() => {
				collectionExistsMock = jest.spyOn(dbService, 'collectionExists');
				clearCollectionMock = jest.spyOn(dbService, 'clearCollection');
				createCollectionMock = jest.spyOn(dbService, 'createCollection');
			});
			afterEach(() => {
				collectionExistsMock.mockReset();
				clearCollectionMock.mockReset();
				createCollectionMock.mockReset();
			});
			it('should clear existing collection if documents already exists', async () => {
				collectionExistsMock.mockReturnValue(Promise.resolve(true));
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(collectionExistsMock).toBeCalledTimes(1);
				expect(clearCollectionMock).toBeCalledWith(collectionName);
				expect(createCollectionMock).not.toBeCalled();
			});
			it('should create new collection if collection does not exist', async () => {
				collectionExistsMock.mockReturnValue(Promise.resolve(false));
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(collectionExistsMock).toBeCalledTimes(1);
				expect(createCollectionMock).toBeCalledWith(collectionName);
				expect(clearCollectionMock).not.toBeCalled();
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
				const readFileMock = jest.spyOn(fileSystemAdapter, 'readFile').mockReturnValue(Promise.resolve(bsonDocsAsText));
				const importCollectionMock = jest.spyOn(dbService, 'importCollection');
				await uc.seedDatabaseCollectionsFromFileSystem([collectionName]);
				expect(readFileMock).toBeCalledWith(`${collectionName}.json`);
				expect(readFileMock).toBeCalledTimes(1);
				const args = importCollectionMock.mock.calls[0];
				expect(importCollectionMock).toBeCalledTimes(1);
				expect(args[0]).toEqual(collectionName);
				expect(JSON.stringify(args[1])).toEqual(
					'[{"_id":"100000000000000000000000","createdAt":"2021-10-04T11:04:45.593Z"}]'
				);
				importCollectionMock.mockReset();
				readFileMock.mockReset();
			});
		});
	});
});
