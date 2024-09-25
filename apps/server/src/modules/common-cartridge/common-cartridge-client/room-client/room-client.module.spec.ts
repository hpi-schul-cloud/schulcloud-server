import { Test, TestingModule } from '@nestjs/testing';
import { CourseRoomsModule } from './room-client.module';
import { CourseRoomsClientAdapter } from './room-client.adapter';

describe(CourseRoomsModule.name, () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				CourseRoomsModule.register({
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
			const courseRoomsClientAdapter = module.get(CourseRoomsClientAdapter);

			expect(courseRoomsClientAdapter).toBeDefined();
		});
	});
});
