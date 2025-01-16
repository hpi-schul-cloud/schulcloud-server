import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { ROOT_PATH, SubmissionContainerElement, SubmissionContainerElementProps } from '../domain';

export const submissionContainerElementFactory = BaseFactory.define<
	SubmissionContainerElement,
	SubmissionContainerElementProps
>(SubmissionContainerElement, () => {
	const inThreeDays = new Date(Date.now() + 259200000);

	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		dueDate: inThreeDays,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
