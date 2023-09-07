/* istanbul ignore file */
import { SubmissionItem, SubmissionItemProps } from '@shared/domain';
import { InputFormat } from '@shared/domain/types';
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
			caption: `file caption  #${sequence}`,
			text: `text  #${sequence}`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
		};
	}
);
