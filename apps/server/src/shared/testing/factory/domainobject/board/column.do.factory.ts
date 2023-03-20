/* istanbul ignore file */
import { Column, ColumnProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const columnFactory = BaseFactory.define<Column, ColumnProps>(Column, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column #${sequence}`,
		cards: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
