import { CopyContentParams } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { H5PContentParentType } from '@modules/h5p-editor';
import { Factory } from 'fishery';

export const h5pEditorCopyContentParamsFactory = Factory.define<CopyContentParams>(() => {
	const params: CopyContentParams = {
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		sourceContentId: new ObjectId().toHexString(),
		copiedContentId: new ObjectId().toHexString(),
		parentId: new ObjectId().toHexString(),
		parentType: H5PContentParentType.BoardElement,
	};

	return params;
});
