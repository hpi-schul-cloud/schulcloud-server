import { INestApplication } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import * as Yjs from 'yjs';
import * as AwarenessProtocol from 'y-protocols/awareness';
import { HttpService } from '@nestjs/axios';
import { WsAdapter } from '@nestjs/platform-ws';
import { TldrawWs } from '../controller';
import { TldrawWsService } from '../service';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from '../repo';
import { MetricsService } from '../metrics';
import { WsSharedDocDo } from '../domain';
import { TldrawRedisFactory, TldrawRedisService } from '.';
import { tldrawTestConfig } from '../testing';

jest.mock('yjs', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('yjs'),
	};
	return moduleMock;
});
jest.mock('y-protocols/awareness', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('y-protocols/awareness'),
	};
	return moduleMock;
});
jest.mock('y-protocols/sync', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('y-protocols/sync'),
	};
	return moduleMock;
});

describe('TldrawRedisService', () => {
	let app: INestApplication;
	let service: TldrawRedisService;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig))],
			providers: [
				TldrawWs,
				TldrawWsService,
				YMongodb,
				MetricsService,
				TldrawRedisFactory,
				TldrawRedisService,
				{
					provide: TldrawBoardRepo,
					useValue: createMock<TldrawBoardRepo>(),
				},
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

		service = testingModule.get(TldrawRedisService);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe('redisMessageHandler', () => {
		const setup = () => {
			const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();
			const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate').mockReturnValueOnce();

			const doc = new WsSharedDocDo('TEST');
			doc.awarenessChannel = 'TEST-awareness';

			return {
				doc,
				applyUpdateSpy,
				applyAwarenessUpdateSpy,
			};
		};

		describe('when channel name is the same as docName', () => {
			it('should call applyUpdate', () => {
				const { doc, applyUpdateSpy } = setup();
				service.handleMessage('TEST', Buffer.from('message'), doc);

				expect(applyUpdateSpy).toHaveBeenCalled();
			});
		});

		describe('when channel name is the same as docAwarenessChannel name', () => {
			it('should call applyAwarenessUpdate', () => {
				const { doc, applyAwarenessUpdateSpy } = setup();
				service.handleMessage('TEST-awareness', Buffer.from('message'), doc);

				expect(applyAwarenessUpdateSpy).toHaveBeenCalled();
			});
		});
	});
});
