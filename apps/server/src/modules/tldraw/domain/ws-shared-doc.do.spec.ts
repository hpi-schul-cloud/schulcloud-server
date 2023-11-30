import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import * as AwarenessProtocol from 'y-protocols/awareness';
import * as Yjs from 'yjs';
import * as Ioredis from 'ioredis';
import { TldrawWsService } from '../service';
import { WsSharedDocDo } from './ws-shared-doc.do';
import { TestConnection } from '../testing/test-connection';
import { TldrawWsTestModule } from '../tldraw-ws-test.module';

jest.mock('y-protocols/awareness', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('y-protocols/awareness'),
	};
	return moduleMock;
});

jest.mock('yjs', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('yjs'),
	};
	return moduleMock;
});

describe('WsSharedDocDo', () => {
	let app: INestApplication;
	let ws: WebSocket;
	let service: TldrawWsService;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);

	jest.useFakeTimers();

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [TldrawWsTestModule],
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

	describe('creating new instance', () => {
		const setup = () => {
			const doc = new WsSharedDocDo('TEST', service);
			const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');
			const loggerSpy = jest.spyOn(service, 'logYDocError');

			return {
				doc,
				redisOnSpy,
				loggerSpy,
			};
		};

		describe('when subscribing to redis channel', () => {
			it('should register new listener', async () => {
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce(() => 1);

				const { doc, redisOnSpy } = setup();

				await delay(20);
				expect(doc).toBeDefined();
				expect(redisOnSpy).toHaveBeenCalled();
			});

			it('should call logYDocError function in service on error', async () => {
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockRejectedValueOnce(() => new Error('error'));

				const { doc, loggerSpy } = setup();

				await delay(20);
				expect(doc).toBeDefined();
				expect(loggerSpy).toHaveBeenCalled();
			});
		});
	});

	describe('redis message handler', () => {
		const setup = () => {
			const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();
			const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate').mockReturnValueOnce();

			const doc = new WsSharedDocDo('TEST', service);
			doc.awarenessChannel = 'TEST-AWARENESS';

			return {
				doc,
				applyUpdateSpy,
				applyAwarenessUpdateSpy,
			};
		};

		describe('when channel name is the same as docName', () => {
			it('should call applyUpdate', () => {
				const { doc, applyUpdateSpy } = setup();

				doc.redisMessageHandler(Buffer.from('TEST'), Buffer.from('message'));

				expect(applyUpdateSpy).toHaveBeenCalled();
			});
		});

		describe('when channel name is the same as docAwarenessChannel name', () => {
			it('should call applyAwarenessUpdate', () => {
				const { doc, applyAwarenessUpdateSpy } = setup();

				doc.redisMessageHandler(Buffer.from('TEST-AWARENESS'), Buffer.from('message'));

				expect(applyAwarenessUpdateSpy).toHaveBeenCalled();
			});
		});
	});

	describe('ydoc client awareness change handler', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl);

			class MockAwareness {
				on = jest.fn();
			}

			const doc = new WsSharedDocDo('TEST', service);
			doc.awareness = new MockAwareness() as unknown as AwarenessProtocol.Awareness;
			const awarenessMetaMock = new Map<number, { clock: number; lastUpdated: number }>();
			awarenessMetaMock.set(1, { clock: 11, lastUpdated: 21 });
			awarenessMetaMock.set(2, { clock: 12, lastUpdated: 22 });
			awarenessMetaMock.set(3, { clock: 13, lastUpdated: 23 });
			const awarenessStatesMock = new Map<number, { [x: string]: unknown }>();
			awarenessStatesMock.set(1, { updating: '21' });
			awarenessStatesMock.set(2, { updating: '22' });
			awarenessStatesMock.set(3, { updating: '23' });
			doc.awareness.states = awarenessStatesMock;
			doc.awareness.meta = awarenessMetaMock;

			const sendSpy = jest.spyOn(service, 'send').mockReturnValue();

			const mockIDs = new Set<number>();
			const mockConns = new Map<WebSocket, Set<number>>();
			mockConns.set(ws, mockIDs);
			doc.conns = mockConns;

			return {
				sendSpy,
				doc,
				mockIDs,
				mockConns,
			};
		};

		describe('when adding two clients states', () => {
			it('should have two registered clients states', async () => {
				const { sendSpy, doc, mockIDs } = await setup();
				const awarenessUpdate = {
					added: [1, 3],
					updated: [],
					removed: [],
				};
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

		describe('when removing one of two existing clients states', () => {
			it('should have one registered client state', async () => {
				const { sendSpy, doc, mockIDs } = await setup();
				let awarenessUpdate: { added: number[]; updated: number[]; removed: number[] } = {
					added: [1, 3],
					updated: [],
					removed: [],
				};

				doc.awarenessChangeHandler(awarenessUpdate, ws);

				awarenessUpdate = {
					added: [],
					updated: [],
					removed: [1],
				};

				doc.awarenessChangeHandler(awarenessUpdate, ws);

				expect(mockIDs.size).toBe(1);
				expect(mockIDs.has(1)).toBe(false);
				expect(mockIDs.has(3)).toBe(true);
				expect(sendSpy).toBeCalled();

				ws.close();
				sendSpy.mockRestore();
			});
		});

		describe('when updating client state', () => {
			it('should not change number of states', async () => {
				const { sendSpy, doc, mockIDs } = await setup();
				let awarenessUpdate: { added: number[]; updated: number[]; removed: number[] } = {
					added: [1],
					updated: [],
					removed: [],
				};

				doc.awarenessChangeHandler(awarenessUpdate, ws);

				awarenessUpdate = {
					added: [],
					updated: [1],
					removed: [],
				};

				doc.awarenessChangeHandler(awarenessUpdate, ws);

				expect(mockIDs.size).toBe(1);
				expect(mockIDs.has(1)).toBe(true);
				expect(sendSpy).toBeCalled();

				ws.close();
				sendSpy.mockRestore();
			});
		});
	});
});
