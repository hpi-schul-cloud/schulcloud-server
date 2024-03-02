import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createConfigModuleOptions } from '@src/config';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { RedisConnectionTypeEnum } from '../types';
import { TldrawConfig } from '../config';
import { tldrawTestConfig } from '../testing';
import { TldrawRedisFactory } from './tldraw-redis.factory';

describe('TldrawRedisFactory', () => {
	let app: INestApplication;
	let configService: ConfigService<TldrawConfig, true>;
	let redisFactory: TldrawRedisFactory;

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

	describe('build', () => {
		it('should throw if REDIS_URI is not set', () => {
			const configSpy = jest.spyOn(configService, 'get').mockReturnValueOnce(null);

			expect(() => redisFactory.build(RedisConnectionTypeEnum.PUBLISH)).toThrow('REDIS_URI is not set');
			configSpy.mockRestore();
		});

		it('should return redis connection', () => {
			const configSpy = jest.spyOn(configService, 'get').mockReturnValueOnce('redis://localhost:6379');
			const redis = redisFactory.build(RedisConnectionTypeEnum.PUBLISH);

			expect(redis).toBeDefined();
			configSpy.mockRestore();
		});
	});
});
