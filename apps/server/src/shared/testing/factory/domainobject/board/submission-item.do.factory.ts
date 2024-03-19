/* istanbul ignore file */
import { SubmissionItem, SubmissionItemProps } from '@shared/domain/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const submissionItemFactory = BaseFactory.define<SubmissionItem, SubmissionItemProps>(
	SubmissionItem,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			title: `submission item #${sequence}`,
			children: [],
			completed: false,
			userId: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
