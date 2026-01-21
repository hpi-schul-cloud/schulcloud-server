import { faker } from '@faker-js/faker/.';
import { createMock } from '@golevelup/ts-jest';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { Request } from 'express';
import { ColumnClientAdapter } from './column-client.adapter';
import { InternalColumnClientConfig } from './column-client.config';
import { ColumnClientModule } from './column-client.module';

@Configuration()
class TestConfig implements InternalColumnClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/columns';
}

describe('ColumnClientModule', () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [ColumnClientModule.register('COLUMN_CLIENT_CONFIG', TestConfig)],
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
		it('should resolve ColumnClientAdapter', async () => {
			const adapter = await module.resolve(ColumnClientAdapter);

			expect(adapter).toBeInstanceOf(ColumnClientAdapter);
		});
	});
});
