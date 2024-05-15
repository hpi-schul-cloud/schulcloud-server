import { ObjectId } from '@mikro-orm/mongodb';
import { SubmissionContainerElement, SubmissionContainerElementProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

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
