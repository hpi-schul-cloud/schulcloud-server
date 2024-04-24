/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { BoardNodeType, Column, ColumnProps, ROOT_PATH } from '../domain';

export const columnFactory = BaseFactory.define<Column, ColumnProps>(Column, ({ sequence }) => {
	const props: ColumnProps = {
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

	return props;
});
