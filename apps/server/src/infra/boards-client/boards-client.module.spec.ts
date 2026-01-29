import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { Request } from 'express';
import { BoardsClientAdapter } from './boards-client.adapter';
import { InternalBoardsClientConfig } from './boards-client.config';
import { BoardsClientModule } from './boards-client.module';
@Configuration()
class TestInternalBoardsClientConfig implements InternalBoardsClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/boards';
}

describe(BoardsClientModule.name, () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [BoardsClientModule.register('BOARDS_CLIENT_CONFIG', TestInternalBoardsClientConfig)],
		})
			.overrideProvider(REQUEST)
			.useValue(requestMock)
			.compile();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(module).toBeDefined();
	});

	describe('when resolving dependencies', () => {
		it('should resolve BoardsClientAdapter', async () => {
			const adapter = await module.resolve(BoardsClientAdapter);

			expect(adapter).toBeInstanceOf(BoardsClientAdapter);
		});
	});
});
