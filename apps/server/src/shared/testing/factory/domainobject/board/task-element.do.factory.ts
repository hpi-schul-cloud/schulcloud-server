/* istanbul ignore file */
import { SubmissionContainerElement, TaskElementProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const taskElementFactory = BaseFactory.define<SubmissionContainerElement, TaskElementProps>(
	SubmissionContainerElement,
	({ sequence }) => {
		const inThreeDays = new Date(Date.now() + 259200000);
		return {
			id: new ObjectId().toHexString(),
			title: `element #${sequence}`,
			children: [],
			dueDate: inThreeDays,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
