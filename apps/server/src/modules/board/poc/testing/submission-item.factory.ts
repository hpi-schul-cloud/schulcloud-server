import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { SubmissionItem, SubmissionItemProps, ROOT_PATH } from '../domain';

export const submissionItemFactory = BaseFactory.define<SubmissionItem, SubmissionItemProps>(
	SubmissionItem,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			completed: true,
			user: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
