/* istanbul ignore file */
import { BoardCompositeProps, Column } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const columnFactory = BaseFactory.define<Column, BoardCompositeProps>(Column, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column #${sequence}`,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
