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
import * as AwarenessProtocol from 'y-protocols/awareness';
import { TldrawWs } from '../controller';

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
	let ws: WebSocket;
	let service: TldrawWsService;

	const gatewayPort = 3346;
	const wsUrl = `ws://localhost:${gatewayPort}`;

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

	describe('when awareness change was called', () => {
		const setup = async () => {
			await setupWs();

			class MockAwareness {
				on = jest.fn();
			}
			const doc = new WsSharedDocDo('TEST', service);
			doc.awareness = new MockAwareness() as unknown as AwarenessProtocol.Awareness;
			const mockMeta = new Map<number, { clock: number; lastUpdated: number }>();
			mockMeta.set(1, { clock: 11, lastUpdated: 21 });
			mockMeta.set(2, { clock: 12, lastUpdated: 22 });
			mockMeta.set(3, { clock: 13, lastUpdated: 23 });
			const states = new Map<number, { [x: string]: unknown }>();
			states.set(1, { updating: '21' });
			states.set(2, { updating: '22' });
			states.set(3, { updating: '23' });
			doc.awareness.states = states;
			doc.awareness.meta = mockMeta;

			const sendSpy = jest.spyOn(service, 'send').mockReturnValueOnce();

			const mockIDs = new Set<number>();
			const mockConns = new Map<WebSocket, Set<number>>();
			mockConns.set(ws, mockIDs);
			doc.conns = mockConns;

			const awarenessUpdate = {
				added: [1, 3],
				updated: [],
				removed: [2],
			};

			return {
				sendSpy,
				doc,
				mockIDs,
				awarenessUpdate,
			};
		};

		it('should correctly update awareness', async () => {
			const { sendSpy, doc, mockIDs, awarenessUpdate } = await setup();

			doc.awarenessChangeHandler(awarenessUpdate, ws);

			expect(mockIDs.size).toBe(2);
			expect(mockIDs.has(1)).toBe(true);
			expect(mockIDs.has(3)).toBe(true);
			expect(mockIDs.has(2)).toBe(false);
			expect(sendSpy).toBeCalled();

			ws.close();
			sendSpy.mockRestore();
		});
	});
});
