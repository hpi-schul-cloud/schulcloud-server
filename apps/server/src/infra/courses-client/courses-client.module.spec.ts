import { faker } from '@faker-js/faker';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { Request } from 'express';
import { CoursesClientAdapter } from './courses-client.adapter';
import { InternalCoursesClientConfig } from './courses-client.config';
import { CoursesClientModule } from './courses-client.module';
import { CoursesApi } from './generated';

@Configuration()
class TestConfig implements InternalCoursesClientConfig {
	@ConfigProperty('API_HOST')
	@IsUrl({ require_tld: false })
	basePath = 'https://api.example.com/courses';
}

describe(CoursesClientModule.name, () => {
	let module: TestingModule;
	let sut: CoursesClientModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [CoursesClientModule.register('COURSES_CLIENT_CONFIG', TestConfig)],
		})
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
