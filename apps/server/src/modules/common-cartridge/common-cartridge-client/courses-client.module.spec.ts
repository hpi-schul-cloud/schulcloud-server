import { TestingModule, Test } from '@nestjs/testing';
import { CoursesClientModule } from './courses-client.module';

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

	it('should be defined', () => {
		expect(module).toBeDefined();
	});
});
