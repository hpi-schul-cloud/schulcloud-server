/* istanbul ignore file */
import { BoardNodeType } from '@shared/domain/entity';
import { BaseFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { Column, ColumnProps } from '../domain';
import { ROOT_PATH } from '../domain/path-utils';

export const columnFactory = BaseFactory.define<Column, ColumnProps>(Column, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		type: BoardNodeType.COLUMN,
		path: ROOT_PATH,
		level: 0,
		title: `column #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
