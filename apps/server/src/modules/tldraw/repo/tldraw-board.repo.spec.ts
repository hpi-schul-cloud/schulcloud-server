import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import { TldrawBoardRepo } from '@src/modules/tldraw/repo/tldraw-board.repo';
import { createMock } from '@golevelup/ts-jest';
import { WsSharedDocDo } from '@src/modules/tldraw/domain/ws-shared-doc.do';
import { TldrawWsService } from '@src/modules/tldraw/service';
import { TldrawWs } from '../controller';
import * as YDocUtils from '../utils';

jest.mock('../utils', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return {
		__esModule: true,
		...jest.requireActual('../utils'),
		calculateDiff: jest.fn(),
	};
});

describe('TldrawBoardRepo', () => {
	let app: INestApplication;
	let repo: TldrawBoardRepo;
	let ws: WebSocket;
	let service: TldrawWsService;

	const gatewayPort = 3346;
	const wsUrl = `ws://localhost:${gatewayPort}`;
	const testMessage =
		'AZQBAaCbuLANBIsBeyJpZCI6ImU1YTYwZGVjLTJkMzktNDAxZS0xMDVhLWIwMmM0N2JkYjFhMiIsInRkVXNlciI6eyJp' +
		'ZCI6ImU1YTYwZGVjLTJkMzktNDAxZS0xMDVhLWIwMmM0N2JkYjFhMiIsImNvbG9yIjoiI0JENTRDNiIsInBvaW50Ijpb' +
		'ODY4LDc2OV0sInNlbGVjdGVkSWRzIjpbXSwiYWN0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	jest.useFakeTimers();

	beforeAll(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [
				TldrawWs,
				TldrawBoardRepo,
				{
					provide: TldrawWsService,
					useValue: createMock<TldrawWsService>(),
				},
			],
		}).compile();

		service = testingModule.get<TldrawWsService>(TldrawWsService);
		repo = testingModule.get<TldrawBoardRepo>(TldrawBoardRepo);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] });
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	const setupWs = async (docName?: string) => {
		if (docName) {
			ws = new WebSocket(`${wsUrl}/${docName}`);
		} else {
			ws = new WebSocket(`${wsUrl}`);
		}
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});
	};

	it('should repo properties be defined', () => {
		expect(repo).toBeDefined();
		expect(repo.mdb).toBeDefined();
		expect(repo.configService).toBeDefined();
		expect(repo.flushSize).toBeDefined();
		expect(repo.multipleCollections).toBeDefined();
		expect(repo.connectionString).toBeDefined();
		expect(repo.collectionName).toBeDefined();
	});

	describe('when document receive empty update', () => {
		const setup = async () => {
			const doc = new WsSharedDocDo('TEST2', service);
			await setupWs('TEST2');
			const wsSet = new Set();
			wsSet.add(ws);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			doc.conns.set(ws, wsSet);
			const storeGetYDocSpy = jest
				.spyOn(repo.mdb, 'getYDoc')
				.mockImplementation(() => new WsSharedDocDo('TEST', service));
			const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdate').mockImplementation(() => {});
			const calculateDiffSpy = jest.spyOn(YDocUtils, 'calculateDiff').mockImplementationOnce(() => 0);

			return {
				doc,
				storeUpdateSpy,
				storeGetYDocSpy,
				calculateDiffSpy,
			};
		};

		it('should not update db with diff', async () => {
			const { doc, storeUpdateSpy, calculateDiffSpy, storeGetYDocSpy } = await setup();

			await repo.updateDocument('TEST2', doc);
			await delay(200);
			expect(storeUpdateSpy).toHaveBeenCalledTimes(0);
			storeUpdateSpy.mockRestore();
			calculateDiffSpy.mockRestore();
			storeGetYDocSpy.mockRestore();
			ws.close();
		});
	});

	describe('when document receive update', () => {
		const setup = async () => {
			const doc = new WsSharedDocDo('TEST', service);
			await setupWs('TEST');
			const wsSet = new Set();
			wsSet.add(ws);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			doc.conns.set(ws, wsSet);
			const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdate').mockImplementation(() => {});
			const storeGetYDocSpy = jest
				.spyOn(repo.mdb, 'getYDoc')
				.mockImplementation(() => new WsSharedDocDo('TEST', service));
			const byteArray = new TextEncoder().encode(testMessage);
			const calculateDiffSpy = jest.spyOn(YDocUtils, 'calculateDiff').mockImplementationOnce(() => 1);

			return {
				doc,
				byteArray,
				storeUpdateSpy,
				storeGetYDocSpy,
				calculateDiffSpy,
			};
		};

		it('should store on db', async () => {
			const { doc, byteArray, storeUpdateSpy, storeGetYDocSpy, calculateDiffSpy } = await setup();

			await repo.updateDocument('TEST', doc);
			doc.emit('update', [byteArray, undefined, doc]);
			await delay(200);
			expect(storeUpdateSpy).toHaveBeenCalled();
			expect(storeUpdateSpy).toHaveBeenCalledTimes(2);
			storeUpdateSpy.mockRestore();
			calculateDiffSpy.mockRestore();
			storeGetYDocSpy.mockRestore();
			ws.close();
		});
	});
});
