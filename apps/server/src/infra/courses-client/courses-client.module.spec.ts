import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { CoursesClientAdapter } from './courses-client.adapter';
import { CoursesClientModule } from './courses-client.module';
import { CoursesApi } from './generated';

describe(CoursesClientModule.name, () => {
	let module: TestingModule;
	let sut: CoursesClientModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [CoursesClientModule, ConfigModule.forRoot({ isGlobal: true })],
		})
			.overrideProvider(ConfigService)
			.useValue(
				createMock<ConfigService>({
					getOrThrow: () => faker.internet.url(),
				})
			)
			.overrideProvider(REQUEST)
			.useValue({ headers: { authorization: `Bearer ${faker.string.alphanumeric(42)}` } } as Request)
			.compile();

		sut = module.get(CoursesClientModule);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('when requesting dependencies', () => {
		it('should resolve CoursesApi', async () => {
			const dependency = await module.resolve(CoursesApi);

			expect(dependency).toBeInstanceOf(CoursesApi);
		});

		it('should resolve CoursesClientAdapter', async () => {
			const dependency = await module.resolve(CoursesClientAdapter);

			expect(dependency).toBeInstanceOf(CoursesClientAdapter);
		});
	});
});
