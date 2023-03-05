import { ColumnBoardPayload, ColumnBoardPayloadProps } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const columnBoardPayloadFactory = BaseFactory.define<ColumnBoardPayload, ColumnBoardPayloadProps>(
	ColumnBoardPayload,
	({ sequence }) => {
		return { name: `board #${sequence}` };
	}
);
