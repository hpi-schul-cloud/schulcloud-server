import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { CourseSynchronizationHistoryEntity, CourseSynchronizationHistoryEntityProps } from '../repo/entity';

export const courseSynchronizationHistoryEntityFactory = BaseFactory.define<
	CourseSynchronizationHistoryEntity,
	CourseSynchronizationHistoryEntityProps
>(CourseSynchronizationHistoryEntity, ({ sequence }) => {
	const entity: CourseSynchronizationHistoryEntityProps = {
		id: new ObjectId().toHexString(),
		externalGroupId: `external-group-id-${sequence}`,
		synchronizedCourse: new ObjectId(),
		expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
		excludeFromSync: [],
	};

	return entity;
});
