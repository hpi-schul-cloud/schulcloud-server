import { Test, TestingModule } from '@nestjs/testing';
import { API_HOST_CONFIG_TOKEN, ApiHostConfig } from '../../api-client.config';
import { CourseRoomsClientAdapter } from './room-client.adapter';
import { CourseRoomsModule } from './room-client.module';

describe(CourseRoomsModule.name, () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [CourseRoomsModule.register(API_HOST_CONFIG_TOKEN, ApiHostConfig)],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when module is initialized', () => {
		it('it should be defined', () => {
			const courseRoomsClientAdapter = module.get(CourseRoomsClientAdapter);

			expect(courseRoomsClientAdapter).toBeDefined();
		});
	});
});
