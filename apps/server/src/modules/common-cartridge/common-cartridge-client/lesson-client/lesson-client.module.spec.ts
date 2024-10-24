import { Test, TestingModule } from '@nestjs/testing';
import { LessonClientModule } from './lesson-client.module';
import { LessonClientAdapter } from './lesson-client.adapter';

describe('LessonClientModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				LessonClientModule.register({
					basePath: 'http://localhost:3030/api/v3',
				}),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when module is initialized', () => {
		it('should have the LessonClientAdapter defined', () => {
			const lessonClientAdapter = module.get(LessonClientAdapter);

			expect(lessonClientAdapter).toBeDefined();
		});
	});
});
