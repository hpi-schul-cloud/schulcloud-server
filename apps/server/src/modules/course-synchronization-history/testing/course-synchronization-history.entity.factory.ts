import { ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { groupEntityFactory } from '@modules/group/testing';
import { systemEntityFactory } from '@modules/system/testing';
import { ExternalSourceEmbeddable } from '@modules/system/repo';
import { BaseFactory } from '@testing/factory/base.factory';
import { CourseSynchronizationHistoryEntity, CourseSynchronizationHistoryEntityProps } from '../repo/entity';

export const courseSynchronizationHistoryEntityFactory = BaseFactory.define<
	CourseSynchronizationHistoryEntity,
	CourseSynchronizationHistoryEntityProps
>(CourseSynchronizationHistoryEntity, ({ sequence }) => {
	const externalGroupId = `external-group-id-${sequence}`;

	const group = groupEntityFactory.buildWithId({
		externalSource: new ExternalSourceEmbeddable({
			externalId: externalGroupId,
			system: systemEntityFactory.buildWithId(),
			lastSyncedAt: new Date(Date.now()),
		}),
	});

	const entity: CourseSynchronizationHistoryEntityProps = {
		externalGroupId,
		id: new ObjectId().toHexString(),
		synchronizedCourse: courseEntityFactory.buildWithId({
			syncedWithGroup: group,
		}),
		expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
		excludeFromSync: [],
	};

	return entity;
});
