import { Test, TestingModule } from '@nestjs/testing';
import { API_HOST_CONFIG_TOKEN, ApiHostConfig } from '../../api-client.config';
import { LessonClientAdapter } from './lesson-client.adapter';
import { LessonClientModule } from './lesson-client.module';

describe('LessonClientModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [LessonClientModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig)],
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
