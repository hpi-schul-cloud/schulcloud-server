/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { Column, ColumnProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

export const columnFactory = BaseFactory.define<Column, ColumnProps>(Column, ({ sequence }) => {
	const props: ColumnProps = {
		id: new ObjectId().toHexString(),
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
