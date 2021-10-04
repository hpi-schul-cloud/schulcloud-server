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
						get EOL() {
							return '<EOL>';
						},
					},
				},
				{
					provide: DatabaseManagementService,
					useValue: {
						getCollectionNames() {
							return ['collectionName1', 'collectionName2'];
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
		let fileSystemAdapterMock: jest.SpyInstance<void, [filePath: string, text: string]>;

		beforeEach(() => {
			fileSystemAdapterMock = jest.spyOn(fileSystemAdapter, 'writeFileSync');
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
		describe('When writing text fo file', () => {
			it('should sort documents by age (id first, then createdAt)', async () => {
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
				const text = fileSystemAdapterMock.mock.calls[0][1];
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
				const arg = fileSystemAdapterMock.mock.calls[0][1];
				expect(arg).toEqual(expect.stringMatching(/<EOL>$/));
			});
			it('should use <collectionName>.json as filename', async () => {
				await uc.exportCollectionsToFileSystem(['collectionName1']);
				expect(fileSystemAdapterMock).toBeCalledTimes(1);
				const arg = fileSystemAdapterMock.mock.calls[0][0];
				expect(arg).toEqual('collectionName1.json');
			});
		});
	});
});
