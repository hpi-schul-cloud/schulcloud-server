import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { Request } from 'express';
import { createMock } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { BoardsClientAdapter } from './boards-client.adapter';
import { BoardsClientConfig } from './boards-client.config';
import { BoardsClientModule } from './boards-client.module';

describe(BoardsClientModule.name, () => {
	let module: TestingModule;

	const requestMock = createMock<Request>({
		headers: {
			authorization: `Bearer ${faker.string.alphanumeric(42)}`,
		},
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [
				BoardsClientModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): BoardsClientConfig => {
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
		it('should resolve BoardsClientAdapter', async () => {
			const adapter = await module.resolve(BoardsClientAdapter);

			expect(adapter).toBeInstanceOf(BoardsClientAdapter);
		});
	});
});
