import { ColumnPayload, ColumnPayloadProps } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const columnPayloadFactory = BaseFactory.define<ColumnPayload, ColumnPayloadProps>(
	ColumnPayload,
	({ sequence }) => {
		return { name: `column #${sequence}`, title: 'Column' };
	}
);
