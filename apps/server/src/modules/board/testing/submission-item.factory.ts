import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { ROOT_PATH, SubmissionItem, SubmissionItemProps } from '../domain';

export const submissionItemFactory = BaseFactory.define<SubmissionItem, SubmissionItemProps>(SubmissionItem, () => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		completed: false,
		userId: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
