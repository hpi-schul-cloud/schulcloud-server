import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { createMock } from '@golevelup/ts-jest';
import { config } from '../config';
import { TldrawBoardRepo } from './tldraw-board.repo';
import { WsSharedDocDo } from '../domain/ws-shared-doc.do';
import { TldrawWsService } from '../service';
import { TldrawWs } from '../controller';
import { TestHelper } from '../helper/test-helper';

describe('TldrawBoardRepo', () => {
	let app: INestApplication;
	let repo: TldrawBoardRepo;
	let ws: WebSocket;
	let service: TldrawWsService;

	const gatewayPort = 3346;
	const wsUrl = TestHelper.getWsUrl(gatewayPort);
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
			ws = await TestHelper.setupWs(wsUrl, 'TEST2');
			const wsSet = new Set();
			wsSet.add(ws);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			doc.conns.set(ws, wsSet);
			const storeGetYDocSpy = jest
				.spyOn(repo.mdb, 'getYDoc')
				.mockImplementation(() => Promise.resolve(new WsSharedDocDo('TEST', service)));
			const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdate').mockImplementation(() => Promise.resolve(1));

			return {
				doc,
				storeUpdateSpy,
				storeGetYDocSpy,
			};
		};

		it('should not update db with diff', async () => {
			const { doc, storeUpdateSpy, storeGetYDocSpy } = await setup();

			await repo.updateDocument('TEST2', doc);
			await delay(100);
			expect(storeUpdateSpy).toHaveBeenCalledTimes(0);
			storeUpdateSpy.mockRestore();
			storeGetYDocSpy.mockRestore();
			ws.close();
		});
	});

	describe('when document receive update', () => {
		const setup = async () => {
			const doc = new WsSharedDocDo('TEST', service);
			ws = await TestHelper.setupWs(wsUrl, 'TEST');
			const wsSet = new Set();
			wsSet.add(ws);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			doc.conns.set(ws, wsSet);
			const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdate').mockImplementation(() => Promise.resolve(1));
			const storeGetYDocSpy = jest
				.spyOn(repo.mdb, 'getYDoc')
				.mockImplementation(() => Promise.resolve(new WsSharedDocDo('TEST', service)));
			const byteArray = new TextEncoder().encode(testMessage);

			return {
				doc,
				byteArray,
				storeUpdateSpy,
				storeGetYDocSpy,
			};
		};

		it('should store on db', async () => {
			const { doc, byteArray, storeUpdateSpy, storeGetYDocSpy } = await setup();

			await repo.updateDocument('TEST', doc);
			doc.emit('update', [byteArray, undefined, doc]);
			await delay(100);
			expect(storeUpdateSpy).toHaveBeenCalled();
			expect(storeUpdateSpy).toHaveBeenCalledTimes(1);
			storeUpdateSpy.mockRestore();
			storeGetYDocSpy.mockRestore();
			ws.close();
		});
	});
});
