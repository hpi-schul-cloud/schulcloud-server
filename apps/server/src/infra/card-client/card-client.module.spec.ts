import { faker } from '@faker-js/faker/.';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { CardClientAdapter, CardClientConfig, CardClientModule } from '.';

describe('CardClientModule', () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				CardClientModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): CardClientConfig => {
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
		it('should resolve CardClientAdapter', async () => {
			const adapter = await module.resolve(CardClientAdapter);

			expect(adapter).toBeInstanceOf(CardClientAdapter);
		});
	});
});
