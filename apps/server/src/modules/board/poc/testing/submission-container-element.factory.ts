import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { SubmissionContainerElement, SubmissionContainerElementProps, ROOT_PATH } from '../domain';

export const submissionContainerElementFactory = BaseFactory.define<
	SubmissionContainerElement,
	SubmissionContainerElementProps
>(SubmissionContainerElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		dueDate: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
