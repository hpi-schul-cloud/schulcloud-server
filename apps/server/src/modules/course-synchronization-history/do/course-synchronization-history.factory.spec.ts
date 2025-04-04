import { ObjectId } from '@mikro-orm/mongodb';
import {
	CourseSynchronizationHistoryBuildParams,
	CourseSynchronizationHistoryFactory,
} from './course-synchronization-history.factory';

describe(CourseSynchronizationHistoryFactory.name, () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('when the params are passed', () => {
		it('should create a CourseSynchronizationHistory based on the passed params', () => {
			const params: CourseSynchronizationHistoryBuildParams = {
				externalGroupId: 'test-external-group-id',
				synchronizedCourse: new ObjectId().toHexString(),
				expiresAt: new Date(),
				excludeFromSync: [],
			};

			const history = CourseSynchronizationHistoryFactory.build(params);

			expect(history.id).toBeDefined();
			expect(history).toMatchObject(params);
		});
	});
});
