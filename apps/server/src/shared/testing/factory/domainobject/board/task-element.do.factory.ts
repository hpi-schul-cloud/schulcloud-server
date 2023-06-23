/* istanbul ignore file */
import { TaskElement, TaskElementProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const taskElementFactory = BaseFactory.define<TaskElement, TaskElementProps>(TaskElement, ({ sequence }) => {
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
