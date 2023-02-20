import { Column, ColumnProps } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const columnFactory = BaseFactory.define<Column, ColumnProps>(Column, ({ sequence }) => {
	return {
		title: `column #${sequence}`,
		cardSkeletons: [],
	};
});
