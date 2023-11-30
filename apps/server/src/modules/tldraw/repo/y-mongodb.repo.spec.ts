import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { ConfigModule } from '@nestjs/config';
import { LegacyLogger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import * as Yjs from 'yjs';
import { tldrawEntityFactory } from '../factory';
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		mdb = testingModule.get(YMongodb);
		em = testingModule.get(EntityManager);
	});

	afterAll(async () => {
		await testingModule.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('getYDoc', () => {
		describe('when getting document with part defined', () => {
			it('should return ydoc from the database', async () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();

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
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();
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
			it('should return ydoc from the database', async () => {
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValue();

				const drawing1 = tldrawEntityFactory.build({ part: undefined });
				const drawing2 = tldrawEntityFactory.build({ part: undefined });
				const drawing3 = tldrawEntityFactory.build({ part: undefined });
				await em.persistAndFlush([drawing1, drawing2, drawing3]);
				em.clear();

				const doc = await mdb.getYDoc('test-name');

				expect(doc).toBeDefined();
				applyUpdateSpy.mockRestore();
			});
		});
	});
});
