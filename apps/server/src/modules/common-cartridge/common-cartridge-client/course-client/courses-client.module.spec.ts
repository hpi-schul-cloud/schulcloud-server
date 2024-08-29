import { TestingModule, Test } from '@nestjs/testing';
import { CoursesClientModule } from './courses-client.module';
import { CoursesClientAdapter } from './courses-client.adapter';

describe('CommonCartridgeClientModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				CoursesClientModule.register({
					basePath: 'http://localhost:3000',
				}),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when module is initialized', () => {
		it('should be defined', () => {
			const coursesClientAdapter = module.get(CoursesClientAdapter);

			expect(coursesClientAdapter).toBeDefined();
		});
	});
});
