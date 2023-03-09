/* istanbul ignore file */
import { ColumnBoard } from '@shared/domain';
import { ObjectId } from 'bson';
import { Factory } from 'fishery';

export const columnBoardFactory = Factory.define<ColumnBoard>(({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column board #${sequence}`,
		columns: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
