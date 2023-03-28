/* istanbul ignore file */
import { BoardNodeProps, ColumnNode } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnNodeFactory = BaseFactory.define<ColumnNode, BoardNodeProps>(ColumnNode, ({ sequence }) => {
	return {
		title: `column #${sequence}`,
	};
});
