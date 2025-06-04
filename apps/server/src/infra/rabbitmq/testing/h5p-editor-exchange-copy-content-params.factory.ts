import { CopyContentParams } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { CopyContentParentType } from '../exchange';

export const h5pEditorExchangeCopyContentParamsFactory = Factory.define<CopyContentParams>(() => {
	const params: CopyContentParams = {
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		sourceContentId: new ObjectId().toHexString(),
		copiedContentId: new ObjectId().toHexString(),
		parentId: new ObjectId().toHexString(),
		parentType: CopyContentParentType.BoardElement,
	};

	return params;
});
