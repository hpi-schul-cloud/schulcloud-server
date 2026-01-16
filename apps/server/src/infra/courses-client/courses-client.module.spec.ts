import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesClientAdapter } from './courses-client.adapter';
import { CoursesClientModule } from './courses-client.module';

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
		it('should resolve CoursesClientAdapter', async () => {
			const dependency = await module.resolve(CoursesClientAdapter);

			expect(dependency).toBeInstanceOf(CoursesClientAdapter);
		});
	});
});
