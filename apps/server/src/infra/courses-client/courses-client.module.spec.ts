import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, TestingModule } from '@nestjs/testing';
import { IsUrl } from 'class-validator';
import { CoursesClientAdapter } from './courses-client.adapter';
import { InternalCoursesClientConfig } from './courses-client.config';
import { CoursesClientModule } from './courses-client.module';

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
		}).compile();

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
		it('should resolve CoursesClientAdapter', async () => {
			const dependency = await module.resolve(CoursesClientAdapter);

			expect(dependency).toBeInstanceOf(CoursesClientAdapter);
		});
	});
});
