import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { ConfigModule } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import * as Yjs from 'yjs';
import { createConfigModuleOptions } from '@src/config';
import { HttpService } from '@nestjs/axios';
import { TldrawRedisFactory, TldrawRedisService } from '../redis';
import { tldrawEntityFactory, tldrawTestConfig } from '../testing';
import { TldrawDrawing } from '../entities';
import { TldrawWs } from '../controller';
import { TldrawWsService } from '../service';
import { MetricsService } from '../metrics';
import { TldrawBoardRepo } from './tldraw-board.repo';
import { TldrawRepo } from './tldraw.repo';
import { YMongodb } from './y-mongodb';

jest.mock('yjs', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('yjs'),
	};
	return moduleMock;
});

describe('YMongoDb', () => {
	let testingModule: TestingModule;
	let mdb: YMongodb;
	let repo: TldrawRepo;
	let em: EntityManager;

	beforeAll(async () => {
		testingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig)),
			],
			providers: [
				TldrawWs,
				TldrawWsService,
				TldrawBoardRepo,
				TldrawRepo,
				YMongodb,
				MetricsService,
				TldrawRedisFactory,
				TldrawRedisService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		mdb = testingModule.get(YMongodb);
		repo = testingModule.get(TldrawRepo);
		em = testingModule.get(EntityManager);
	});

	afterAll(async () => {
		await testingModule.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('storeUpdateTransactional', () => {
		describe('when clock is defined', () => {
			const setup = async () => {
				const drawing = tldrawEntityFactory.build({ clock: 1 });
				await em.persistAndFlush(drawing);
				em.clear();

				return { drawing };
			};

			it('should create new document with updates in the database', async () => {
				const { drawing } = await setup();

				await mdb.storeUpdateTransactional(drawing.docName, new Uint8Array([]));
				const docs = await em.findAndCount(TldrawDrawing, { docName: drawing.docName });

				expect(docs.length).toEqual(2);
			});
		});

		describe('when clock is undefined', () => {
			const setup = async () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();
				const drawing = tldrawEntityFactory.build({ clock: undefined });

				await em.persistAndFlush(drawing);
				em.clear();

				return {
					applyUpdateSpy,
					drawing,
				};
			};

			it('should call applyUpdate and create new document with updates in the database', async () => {
				const { applyUpdateSpy, drawing } = await setup();

				await mdb.storeUpdateTransactional(drawing.docName, new Uint8Array([2, 2]));
				const docs = await em.findAndCount(TldrawDrawing, { docName: drawing.docName });

				expect(applyUpdateSpy).toHaveBeenCalled();
				expect(docs.length).toEqual(2);
			});
		});
	});

	describe('compressDocumentTransactional', () => {
		const setup = async () => {
			const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();
			const mergeUpdatesSpy = jest.spyOn(Yjs, 'mergeUpdates').mockReturnValueOnce(new Uint8Array([]));

			const drawing1 = tldrawEntityFactory.build({ clock: 1, part: undefined });
			const drawing2 = tldrawEntityFactory.build({ clock: 2, part: undefined });
			const drawing3 = tldrawEntityFactory.build({ clock: 3, part: undefined });
			const drawing4 = tldrawEntityFactory.build({ clock: 4, part: undefined });

			await em.persistAndFlush([drawing1, drawing2, drawing3, drawing4]);
			em.clear();

			return {
				applyUpdateSpy,
				mergeUpdatesSpy,
				drawing1,
			};
		};

		it('should merge multiple documents with the same name in the database into two (one main document and one with update)', async () => {
			const { applyUpdateSpy, drawing1 } = await setup();

			await mdb.compressDocumentTransactional(drawing1.docName);
			const docs = await em.findAndCount(TldrawDrawing, { docName: drawing1.docName });

			expect(docs.length).toEqual(2);
			applyUpdateSpy.mockRestore();
		});
	});

	describe('createIndex', () => {
		const setup = () => {
			const ensureIndexesSpy = jest.spyOn(repo, 'ensureIndexes').mockResolvedValueOnce();

			return {
				ensureIndexesSpy,
			};
		};

		it('should create index', async () => {
			const { ensureIndexesSpy } = setup();

			await mdb.createIndex();

			expect(ensureIndexesSpy).toHaveBeenCalled();
		});
	});

	describe('getAllDocumentNames', () => {
		const setup = async () => {
			const drawing1 = tldrawEntityFactory.build({ docName: 'test-name1', version: 'v1_sv' });
			const drawing2 = tldrawEntityFactory.build({ docName: 'test-name2', version: 'v1_sv' });
			const drawing3 = tldrawEntityFactory.build({ docName: 'test-name3', version: 'v1_sv' });

			await em.persistAndFlush([drawing1, drawing2, drawing3]);
			em.clear();
		};

		it('should return all document names', async () => {
			await setup();

			const docNames = await mdb.getAllDocumentNames();

			expect(docNames).toEqual(['test-name1', 'test-name2', 'test-name3']);
		});
	});

	describe('getYDoc', () => {
		describe('when getting document with well defined parts', () => {
			const setup = async () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();
				const mergeUpdatesSpy = jest.spyOn(Yjs, 'mergeUpdates').mockReturnValue(new Uint8Array([]));

				const drawing1 = tldrawEntityFactory.build({ clock: 1, part: 1 });
				const drawing2 = tldrawEntityFactory.build({ clock: 1, part: 2 });
				const drawing3 = tldrawEntityFactory.build({ clock: 2, part: 1 });

				await em.persistAndFlush([drawing1, drawing2, drawing3]);
				em.clear();

				return {
					applyUpdateSpy,
					mergeUpdatesSpy,
					drawing1,
					drawing2,
					drawing3,
				};
			};

			it('should return ydoc', async () => {
				const { applyUpdateSpy } = await setup();

				const doc = await mdb.getDocument('test-name');

				expect(doc).toBeDefined();
				applyUpdateSpy.mockRestore();
			});
		});

		describe('when getting document with missing parts', () => {
			const setup = async () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();

				const drawing1 = tldrawEntityFactory.build({ clock: 1, part: 1 });
				const drawing4 = tldrawEntityFactory.build({ clock: 1, part: 3 });
				const drawing5 = tldrawEntityFactory.build({ clock: 1, part: 4 });

				await em.persistAndFlush([drawing1, drawing4, drawing5]);
				em.clear();

				return {
					applyUpdateSpy,
				};
			};

			it('should not return ydoc', async () => {
				const { applyUpdateSpy } = await setup();

				const doc = await mdb.getDocument('test-name');

				expect(doc).toBeUndefined();
				applyUpdateSpy.mockRestore();
			});
		});

		describe('when getting document with part undefined', () => {
			const setup = async () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();
				const drawing1 = tldrawEntityFactory.build({ part: undefined });
				const drawing2 = tldrawEntityFactory.build({ part: undefined });
				const drawing3 = tldrawEntityFactory.build({ part: undefined });

				await em.persistAndFlush([drawing1, drawing2, drawing3]);
				em.clear();

				return {
					applyUpdateSpy,
				};
			};

			it('should return ydoc from the database', async () => {
				const { applyUpdateSpy } = await setup();

				const doc = await mdb.getDocument('test-name');

				expect(doc).toBeDefined();
				applyUpdateSpy.mockRestore();
			});

			describe('when single entity size is greater than MAX_DOCUMENT_SIZE', () => {
				it('should return ydoc from the database', async () => {
					const { applyUpdateSpy } = await setup();

					const doc = await mdb.getDocument('test-name');

					expect(doc).toBeDefined();
					applyUpdateSpy.mockRestore();
				});
			});
		});
	});
});
