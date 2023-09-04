/* istanbul ignore file */
import { InputFormat, SubmissionItem, SubmissionItemProps } from '@shared/domain';
import { ObjectId } from 'bson';
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
			description: {
				text: 'bla',
				inputFormat: InputFormat.RICH_TEXT_CK5,
			},
		};
	}
);
