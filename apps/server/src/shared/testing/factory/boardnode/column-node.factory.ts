/* istanbul ignore file */

import { BoardNodeProps } from '@shared/domain/entity/boardnode/boardnode.entity';
import { ColumnNode } from '@shared/domain/entity/boardnode/column-node.entity';
import { BaseFactory } from '../base.factory';

export const columnNodeFactory = BaseFactory.define<ColumnNode, BoardNodeProps>(ColumnNode, ({ sequence }) => {
	return {
		title: `column #${sequence}`,
	};
});
