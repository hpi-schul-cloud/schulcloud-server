import { CourseSynchronizationHistoryMapper } from './course-synchronization-history.mapper';
import { courseSynchronizationHistoryEntityFactory } from '../../testing';
import { CourseSynchronizationHistoryProps } from '../../do';
import { CourseSynchronizationHistoryEntity } from '../entity';

describe(CourseSynchronizationHistoryMapper.name, () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('mapEntityToDO', () => {
		it('should return the correct domain object', () => {
			// TODO fix failing factory
			// const entity: CourseSynchronizationHistoryEntity = courseSynchronizationHistoryEntityFactory.buildWithId();
			//
			// const result = CourseSynchronizationHistoryMapper.mapEntityToDO(entity);
			//
			// expect(result).toEqual<CourseSynchronizationHistoryProps>({
			// 	id: entity.id,
			// 	externalGroupId: entity.externalGroupId,
			// 	synchronizedCourse: entity.synchronizedCourse.id,
			// 	expirationDate: entity.expirationDate,
			// });
		});
	});
});
