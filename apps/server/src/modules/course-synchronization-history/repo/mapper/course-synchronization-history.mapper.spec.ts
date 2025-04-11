import { CourseEntity } from '@modules/course/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { courseSynchronizationHistoryEntityFactory } from '../../testing';
import { CourseSynchronizationHistoryProps } from '../../do';
import { CourseSynchronizationHistoryEntity } from '../entity';
import { CourseSynchronizationHistoryMapper } from './course-synchronization-history.mapper';

describe(CourseSynchronizationHistoryMapper.name, () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseSynchronizationHistoryEntity, CourseEntity] })],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapEntityToDO', () => {
		it('should return the correct domain object', () => {
			const entity: CourseSynchronizationHistoryEntity = courseSynchronizationHistoryEntityFactory.build();

			const result = CourseSynchronizationHistoryMapper.mapEntityToDO(entity);

			expect(result.getProps()).toEqual<CourseSynchronizationHistoryProps>({
				id: entity.id,
				externalGroupId: entity.externalGroupId,
				synchronizedCourse: entity.synchronizedCourse.id,
				expiresAt: entity.expiresAt,
				excludeFromSync: entity.excludeFromSync,
			});
		});
	});
});
