import { ColumnNode, ColumnNodeProperties } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnNodeFactory = BaseFactory.define<ColumnNode, ColumnNodeProperties>(ColumnNode, ({ sequence }) => {
	return {
		title: `column #${sequence}`,
	};
});
