import { ObjectId } from '@mikro-orm/mongodb';
import { SubmissionItem, SubmissionItemProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

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
