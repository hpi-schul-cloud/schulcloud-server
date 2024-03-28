/* istanbul ignore file */
import { Column, ColumnProps } from '@shared/domain/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const columnFactory = BaseFactory.define<Column, ColumnProps>(Column, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column #${sequence}`,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
