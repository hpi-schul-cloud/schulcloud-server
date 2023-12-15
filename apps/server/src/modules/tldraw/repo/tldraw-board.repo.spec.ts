import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { Doc } from 'yjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { createConfigModuleOptions } from '@src/config';
import * as YjsUtils from '../utils/ydoc-utils';
import { TldrawBoardRepo } from './tldraw-board.repo';
import { WsSharedDocDo } from '../domain';
import { TldrawWsService } from '../service';
import { TestConnection } from '../testing';
import { TldrawDrawing } from '../entities';
import { config } from '../config';
import { TldrawWs } from '../controller';
import { TldrawRepo } from './tldraw.repo';
import { YMongodb } from './y-mongodb';

describe('TldrawBoardRepo', () => {
	let app: INestApplication;
	let repo: TldrawBoardRepo;
	let ws: WebSocket;
	let logger: DeepMocked<Logger>;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	jest.useFakeTimers();

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(config)),
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

		repo = testingModule.get<TldrawBoardRepo>(TldrawBoardRepo);
		app = testingModule.createNestApplication();
		logger = testingModule.get(Logger);
		app.useWebSocketAdapter(new WsAdapter(app));
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] });
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should check if repo and its properties are set correctly', () => {
		expect(repo).toBeDefined();
		expect(repo.mdb).toBeDefined();
	});

	describe('updateDocument', () => {
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

				await repo.updateDocument('TEST2', doc);

				expect(storeUpdateSpy).toHaveBeenCalledTimes(0);
				storeUpdateSpy.mockRestore();
				storeGetYDocSpy.mockRestore();
				ws.close();
			});
		});

		describe('when document receive update', () => {
			const setup = async () => {
				const clientMessageMock = 'test-message';
				const doc = new WsSharedDocDo('TEST');
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const wsSet: Set<number> = new Set();
				wsSet.add(0);
				doc.connections.set(ws, wsSet);
				const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional').mockResolvedValue(1);
				const storeGetYDocSpy = jest.spyOn(repo.mdb, 'getYDoc').mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				const byteArray = new TextEncoder().encode(clientMessageMock);
				const errorLogSpy = jest.spyOn(logger, 'warning');

				return {
					doc,
					byteArray,
					storeUpdateSpy,
					storeGetYDocSpy,
					errorLogSpy,
				};
			};

			it('should update db with diff', async () => {
				const { doc, byteArray, storeUpdateSpy, storeGetYDocSpy } = await setup();

				await repo.updateDocument('TEST', doc);
				doc.emit('update', [byteArray, undefined, doc]);

				expect(storeUpdateSpy).toHaveBeenCalled();
				expect(storeUpdateSpy).toHaveBeenCalledTimes(1);
				storeUpdateSpy.mockRestore();
				storeGetYDocSpy.mockRestore();
				ws.close();
			});

			it('should log error if update fails', async () => {
				const { doc, byteArray, storeGetYDocSpy, errorLogSpy } = await setup();
				const storeUpdateSpy = jest
					.spyOn(repo.mdb, 'storeUpdateTransactional')
					.mockRejectedValueOnce(new Error('test error'));

				await repo.updateDocument('TEST', doc);
				doc.emit('update', [byteArray, undefined, doc]);
				await delay(10);

				expect(storeUpdateSpy).toHaveBeenCalled();
				expect(storeUpdateSpy).toHaveBeenCalledTimes(1);
				expect(errorLogSpy).toHaveBeenCalled();
				storeUpdateSpy.mockRestore();
				storeGetYDocSpy.mockRestore();
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

				expect(await repo.getYDocFromMdb('test')).toBeInstanceOf(Doc);
				storeGetYDocSpy.mockRestore();
			});
		});
	});

	describe('updateStoredDocWithDiff', () => {
		describe('when the difference between update and current drawing is more than 0', () => {
			const setup = () => {
				const calculateDiffSpy = jest.spyOn(YjsUtils, 'calculateDiff').mockReturnValueOnce(1);
				const storeUpdateSpy = jest
					.spyOn(repo.mdb, 'storeUpdateTransactional')
					.mockResolvedValueOnce(Promise.resolve(1));

				return {
					calculateDiffSpy,
					storeUpdateSpy,
				};
			};

			it('should call store update method', () => {
				const { storeUpdateSpy, calculateDiffSpy } = setup();
				const diffArray = new Uint8Array();

				repo.updateStoredDocWithDiff('test', diffArray);

				expect(storeUpdateSpy).toHaveBeenCalled();
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

			it('should not call store update method', () => {
				const { storeUpdateSpy, calculateDiffSpy } = setup();
				const diffArray = new Uint8Array();

				repo.updateStoredDocWithDiff('test', diffArray);

				expect(storeUpdateSpy).not.toHaveBeenCalled();
				calculateDiffSpy.mockRestore();
				storeUpdateSpy.mockRestore();
			});
		});
	});

	describe('flushDocument', () => {
		const setup = () => {
			const flushDocumentSpy = jest
				.spyOn(repo.mdb, 'flushDocumentTransactional')
				.mockResolvedValueOnce(Promise.resolve());

			return { flushDocumentSpy };
		};

		it('should call flush method on mdbPersistence', async () => {
			const { flushDocumentSpy } = setup();

			await repo.flushDocument('test');

			expect(flushDocumentSpy).toHaveBeenCalled();
			flushDocumentSpy.mockRestore();
		});
	});
});
