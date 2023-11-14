/* eslint-disable @typescript-eslint/no-unused-vars */
import { OAuthTokenDto } from '@modules/oauth';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConfigService } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { SchoolInMigrationLoggableException } from '../loggable';
import { XApiKeyStrategy } from './x-api-key.strategy';
import { IXApiKeyConfig } from '../config/x-api-key.config';

describe('XApiKeyStrategy', () => {
	let module: TestingModule;
	let strategy: XApiKeyStrategy;
	let configService: ConfigService<IXApiKeyConfig, true>;
	Configuration.set('ADMIN_API__ALLOWED_API_KEYS', '1ab2c3d4e5f61ab2c3d4e5f6');

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				XApiKeyStrategy,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<IXApiKeyConfig, true>>({ get: () => ['1ab2c3d4e5f61ab2c3d4e5f6'] }),
				},
			],
		}).compile();

		strategy = module.get(XApiKeyStrategy);
		configService = module.get(ConfigService<IXApiKeyConfig, true>);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('validate', () => {
		const setup = () => {
			const CORRECT_API_KEY = '1ab2c3d4e5f61ab2c3d4e5f6';
			const INVALID_API_KEY = '1ab2c3d4e5f61ab2c3d4e5f6778173';
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const done = jest.fn((error: Error | null, data: boolean | null) => {});

			return { CORRECT_API_KEY, INVALID_API_KEY, done };
		};
		describe('when a valid api key is provided', () => {
			it('should do nothing', () => {
				const { CORRECT_API_KEY, done } = setup();
				const result = strategy.validate(CORRECT_API_KEY, done);
				expect(done).toBeCalledWith(null, true);
			});
		});

		describe('when a invalid api key is provided', () => {
			it('should throw error', () => {
				const { INVALID_API_KEY, done } = setup();
				const result = strategy.validate(INVALID_API_KEY, done);
				expect(done).toBeCalledWith(new UnauthorizedException(), null);
			});
		});
	});

	describe('constructor', () => {
		it('should create strategy', () => {
			const ApiKeyStrategy = new XApiKeyStrategy(configService);
			expect(ApiKeyStrategy).toBeDefined();
			expect(ApiKeyStrategy).toBeInstanceOf(XApiKeyStrategy);
		});
	});
});
