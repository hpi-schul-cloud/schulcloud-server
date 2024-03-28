/* istanbul ignore file */
import { SubmissionContainerElement, SubmissionContainerElementProps } from '@shared/domain/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const submissionContainerElementFactory = BaseFactory.define<
	SubmissionContainerElement,
	SubmissionContainerElementProps
>(SubmissionContainerElement, ({ sequence }) => {
	const inThreeDays = new Date(Date.now() + 259200000);
	return {
		id: new ObjectId().toHexString(),
		title: `element #${sequence}`,
		children: [],
		dueDate: inThreeDays,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
