import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { Doc } from 'yjs';
import * as Yjs from 'yjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { createConfigModuleOptions } from '@src/config';
import * as YjsUtils from '../utils/ydoc-utils';
import { TldrawBoardRepo } from './tldraw-board.repo';
import { WsSharedDocDo } from '../domain';
import { TldrawWsService } from '../service';
import { TestConnection, tldrawTestConfig } from '../testing';
import { TldrawDrawing } from '../entities';
import { TldrawWs } from '../controller';
import { MetricsService } from '../metrics';
import { TldrawRepo } from './tldraw.repo';
import { YMongodb } from './y-mongodb';
import { TldrawRedisFactory } from '../redis';

jest.mock('yjs', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('yjs'),
	};
	return moduleMock;
});

describe('TldrawBoardRepo', () => {
	let app: INestApplication;
	let repo: TldrawBoardRepo;
	let ws: WebSocket;
	let logger: DeepMocked<Logger>;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig)),
			],
			providers: [
				TldrawWs,
				TldrawWsService,
				TldrawBoardRepo,
				YMongodb,
				MetricsService,
				TldrawRedisFactory,
				{
					provide: TldrawRepo,
					useValue: createMock<TldrawRepo>(),
				},
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

		repo = testingModule.get(TldrawBoardRepo);
		logger = testingModule.get(Logger);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();

		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should check if repo and its properties are set correctly', () => {
		expect(repo).toBeDefined();
		expect(repo.mdb).toBeDefined();
	});

	describe('loadDocument', () => {
		describe('when document receives empty update', () => {
			const setup = async () => {
				const doc = new WsSharedDocDo('TEST2');
				ws = await TestConnection.setupWs(wsUrl, 'TEST2');
				const wsSet: Set<number> = new Set();
				wsSet.add(0);
				doc.connections.set(ws, wsSet);
				const storeGetYDocSpy = jest.spyOn(repo.mdb, 'getYDoc').mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional').mockResolvedValueOnce(1);

				return {
					doc,
					storeUpdateSpy,
					storeGetYDocSpy,
				};
			};

			it('should not update db with diff', async () => {
				const { doc, storeUpdateSpy, storeGetYDocSpy } = await setup();

				await repo.loadDocument('TEST2', doc);

				expect(storeUpdateSpy).toHaveBeenCalledTimes(0);
				storeUpdateSpy.mockRestore();
				storeGetYDocSpy.mockRestore();
				ws.close();
			});
		});

		describe('when document receive update', () => {
			const setup = async () => {
				const doc = new WsSharedDocDo('TEST');
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const wsSet: Set<number> = new Set();
				wsSet.add(0);
				doc.connections.set(ws, wsSet);
				const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional').mockResolvedValueOnce(1);
				const storeGetYDocSpy = jest.spyOn(repo.mdb, 'getYDoc').mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();

				return {
					doc,
					storeUpdateSpy,
					applyUpdateSpy,
					storeGetYDocSpy,
				};
			};

			it('should call applyUpdate', async () => {
				const { doc, applyUpdateSpy } = await setup();

				await repo.loadDocument('TEST', doc);

				expect(applyUpdateSpy).toHaveBeenCalled();
				applyUpdateSpy.mockRestore();
				ws.close();
			});
		});
	});

	describe('getYDocFromMdb', () => {
		describe('when taking doc data from db', () => {
			const setup = () => {
				const storeGetYDocSpy = jest.spyOn(repo.mdb, 'getYDoc').mockResolvedValueOnce(new WsSharedDocDo('TEST'));

				return {
					storeGetYDocSpy,
				};
			};

			it('should return ydoc', async () => {
				const { storeGetYDocSpy } = setup();

				const result = await repo.getYDocFromMdb('test');

				expect(result).toBeInstanceOf(Doc);
				storeGetYDocSpy.mockRestore();
			});
		});
	});

	describe('updateStoredDocWithDiff', () => {
		describe('when the difference between update and current drawing is more than 0', () => {
			const setup = (shouldStoreUpdateThrowError: boolean) => {
				const calculateDiffSpy = jest.spyOn(YjsUtils, 'calculateDiff').mockReturnValueOnce(1);
				const errorLogSpy = jest.spyOn(logger, 'warning');
				const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional');

				if (shouldStoreUpdateThrowError) {
					storeUpdateSpy.mockRejectedValueOnce(new Error('test error'));
				} else {
					storeUpdateSpy.mockResolvedValueOnce(1);
				}

				return {
					calculateDiffSpy,
					errorLogSpy,
					storeUpdateSpy,
				};
			};

			it('should call store update method', async () => {
				const { calculateDiffSpy, storeUpdateSpy } = setup(false);
				// const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional').mockResolvedValueOnce(1);
				const diffArray = new Uint8Array();

				await repo.updateStoredDocWithDiff('test', diffArray);

				expect(storeUpdateSpy).toHaveBeenCalled();
				calculateDiffSpy.mockRestore();
				storeUpdateSpy.mockRestore();
			});

			it('should log error if update fails', async () => {
				const { calculateDiffSpy, errorLogSpy, storeUpdateSpy } = setup(true);
				// const storeUpdateSpy = jest
				// 	.spyOn(repo.mdb, 'storeUpdateTransactional')
				// 	.mockRejectedValueOnce(new Error('test error'));
				const diffArray = new Uint8Array();
				await expect(repo.updateStoredDocWithDiff('test', diffArray)).rejects.toThrow('test error');

				expect(storeUpdateSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				calculateDiffSpy.mockRestore();
				storeUpdateSpy.mockRestore();
			});
		});

		describe('when the difference between update and current drawing is 0', () => {
			const setup = () => {
				const calculateDiffSpy = jest.spyOn(YjsUtils, 'calculateDiff').mockReturnValueOnce(0);
				const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional');

				return {
					calculateDiffSpy,
					storeUpdateSpy,
				};
			};

			it('should not call store update method', async () => {
				const { storeUpdateSpy, calculateDiffSpy } = setup();
				const diffArray = new Uint8Array();

				await repo.updateStoredDocWithDiff('test', diffArray);

				expect(storeUpdateSpy).not.toHaveBeenCalled();
				calculateDiffSpy.mockRestore();
				storeUpdateSpy.mockRestore();
			});
		});
	});

	describe('compressDocument', () => {
		const setup = () => {
			const flushDocumentSpy = jest.spyOn(repo.mdb, 'compressDocumentTransactional').mockResolvedValueOnce();

			return { flushDocumentSpy };
		};

		it('should call compress method on YMongo', async () => {
			const { flushDocumentSpy } = setup();

			await repo.compressDocument('test');

			expect(flushDocumentSpy).toHaveBeenCalled();
			flushDocumentSpy.mockRestore();
		});
	});

	describe('storeUpdate', () => {
		const setup = () => {
			const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional');
			const getCurrentUpdateClockSpy = jest.spyOn(repo.mdb, 'getCurrentUpdateClock').mockResolvedValue(2);
			const compressDocumentSpy = jest.spyOn(repo.mdb, 'compressDocumentTransactional').mockResolvedValueOnce();

			return {
				storeUpdateSpy,
				getCurrentUpdateClockSpy,
				compressDocumentSpy,
			};
		};

		it('should call store update method on YMongo', async () => {
			const { storeUpdateSpy } = setup();

			await repo.storeUpdate('test', new Uint8Array());

			expect(storeUpdateSpy).toHaveBeenCalled();
			storeUpdateSpy.mockRestore();
		});

		it('should call compressDocument if compress threshold was reached', async () => {
			const { storeUpdateSpy, getCurrentUpdateClockSpy, compressDocumentSpy } = setup();

			await repo.storeUpdate('test', new Uint8Array());

			expect(storeUpdateSpy).toHaveBeenCalled();
			expect(getCurrentUpdateClockSpy).toHaveBeenCalled();
			expect(compressDocumentSpy).toHaveBeenCalled();
			storeUpdateSpy.mockRestore();
		});
	});
});
