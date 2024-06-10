import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import * as Yjs from 'yjs';
import * as AwarenessProtocol from 'y-protocols/awareness';
import { DomainErrorHandler } from '@src/core';
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

describe('TldrawRedisService', () => {
	let service: TldrawRedisService;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig))],
			providers: [
				TldrawRedisFactory,
				TldrawRedisService,
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		service = testingModule.get(TldrawRedisService);
	});

	afterEach(() => {
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
