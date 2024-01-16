import { ConfigModule, ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { Test } from '@nestjs/testing';
import { createConfigModuleOptions } from '@src/config';
import { tldrawTestConfig } from '@modules/tldraw/testing';
import { TldrawRedisFactory } from '@modules/tldraw/redis/tldraw-redis.factory';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';

describe('TldrawRedisFactory', () => {
	let app: INestApplication;
	let configService: ConfigService<TldrawConfig, true>;
	let logger: DeepMocked<Logger>;
	let redisFactory: DeepMocked<TldrawRedisFactory>;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig))],
			providers: [
				TldrawRedisFactory,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		configService = testingModule.get(ConfigService);
		logger = testingModule.get(Logger);
		redisFactory = testingModule.get(TldrawRedisFactory);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should check if factory was created', () => {
		expect(redisFactory).toBeDefined();
	});

	describe('constructor', () => {
		it('should throw if REDIS_URI is not set', () => {
			const configSpy = jest.spyOn(configService, 'get').mockReturnValue(null);

			expect(() => new TldrawRedisFactory(configService, logger)).toThrow('REDIS_URI is not set');
			configSpy.mockRestore();
		});
	});
});
