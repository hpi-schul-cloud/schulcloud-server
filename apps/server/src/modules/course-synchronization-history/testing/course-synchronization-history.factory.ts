import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import { CourseSynchronizationHistory, CourseSynchronizationHistoryProps } from '../domain';

export const courseSynchronizationHistoryFactory = DomainObjectFactory.define<
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryProps
>(CourseSynchronizationHistory, ({ sequence }) => {
	const history: CourseSynchronizationHistoryProps = {
		id: new ObjectId().toHexString(),
		externalGroupId: `external-group-id-${sequence}`,
		synchronizedCourse: new ObjectId().toHexString(),
		expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
		excludeFromSync: [],
	};

	return history;
});
