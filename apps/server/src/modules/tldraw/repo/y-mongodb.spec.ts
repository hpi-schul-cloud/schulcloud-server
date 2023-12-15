import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { ConfigModule } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import * as Yjs from 'yjs';
import { tldrawEntityFactory } from '../testing';
import { TldrawDrawing } from '../entities';
import { TldrawWs } from '../controller';
import { TldrawWsService } from '../service';
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
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					validate: () => {
						return {
							TLDRAW_DB_FLUSH_SIZE: 2,
						};
					},
				}),
			],
			providers: [
				TldrawWs,
				TldrawWsService,
				TldrawBoardRepo,
				TldrawRepo,
				YMongodb,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
		it('should create new document with updates in the database', async () => {
			const drawing = tldrawEntityFactory.build({ clock: 1 });

			await em.persistAndFlush(drawing);
			em.clear();
			await mdb.storeUpdateTransactional(drawing.docName, new Uint8Array([2, 2]));
			const docs = await em.findAndCount(TldrawDrawing, { docName: drawing.docName });

			expect(docs.length).toEqual(2);
		});
	});

	describe('flushDocumentTransactional', () => {
		const setup = () => {
			const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();

			return {
				applyUpdateSpy,
			};
		};

		it('should merge multiple documents with the same name in the database into two (one main document and one with update)', async () => {
			const { applyUpdateSpy } = setup();
			const drawing1 = tldrawEntityFactory.build({ clock: 1 });
			const drawing2 = tldrawEntityFactory.build({ clock: 2 });
			const drawing3 = tldrawEntityFactory.build({ clock: 3 });
			const drawing4 = tldrawEntityFactory.build({ clock: 4 });

			await em.persistAndFlush([drawing1, drawing2, drawing3, drawing4]);
			em.clear();
			await mdb.flushDocumentTransactional(drawing1.docName);
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

	describe('getYDoc', () => {
		describe('when getting document with part defined', () => {
			const setup = () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();

				return {
					applyUpdateSpy,
				};
			};

			it('should return ydoc from the database', async () => {
				const { applyUpdateSpy } = setup();
				const drawing1 = tldrawEntityFactory.build({ clock: 1, part: 1 });
				const drawing2 = tldrawEntityFactory.build({ clock: 1, part: 2 });
				const drawing3 = tldrawEntityFactory.build({ clock: 2, part: 1 });

				await em.persistAndFlush([drawing1, drawing2, drawing3]);
				em.clear();
				const doc = await mdb.getYDoc('test-name');

				expect(doc).toBeDefined();
				applyUpdateSpy.mockRestore();
			});

			it('should not return ydoc if part is missing', async () => {
				const { applyUpdateSpy } = setup();
				const drawing1 = tldrawEntityFactory.build({ clock: 1, part: 1 });
				const drawing2 = tldrawEntityFactory.build({ clock: 1, part: 3 });
				const drawing3 = tldrawEntityFactory.build({ clock: 1, part: 4 });

				await em.persistAndFlush([drawing1, drawing2, drawing3]);
				em.clear();
				const doc = await mdb.getYDoc('test-name');

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

				const doc = await mdb.getYDoc('test-name');

				expect(doc).toBeDefined();
				applyUpdateSpy.mockRestore();
			});

			describe('when single entity size is greater than MAX_DOCUMENT_SIZE', () => {
				it('should return ydoc from the database', async () => {
					// set private property to 1 instead of creating mock 15mb document
					// eslint-disable-next-line @typescript-eslint/dot-notation
					mdb['MAX_DOCUMENT_SIZE'] = 1;
					const { applyUpdateSpy } = await setup();

					const doc = await mdb.getYDoc('test-name');

					expect(doc).toBeDefined();
					// eslint-disable-next-line @typescript-eslint/dot-notation
					mdb['MAX_DOCUMENT_SIZE'] = 15000000;
					applyUpdateSpy.mockRestore();
				});
			});
		});
	});
});
