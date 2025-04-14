import { faker } from '@faker-js/faker/.';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ColumnClientModule } from './column-client.module';
import { ColumnClientConfig } from './column-client.config';
import { ColumnClientAdapter } from './column-client.adapter';

describe('ColumnClientModule', () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				ColumnClientModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): ColumnClientConfig => {
							return {
								API_HOST: faker.internet.url(),
							};
						},
					],
				}),
			],
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
