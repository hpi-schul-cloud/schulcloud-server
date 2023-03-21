/* istanbul ignore file */
import { ColumnNode, ColumnNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnNodeFactory = BaseFactory.define<ColumnNode, ColumnNodeProps>(ColumnNode, ({ sequence }) => {
	return {
		title: `column #${sequence}`,
	};
});
