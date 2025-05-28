import { H5PContentParentType } from '@modules/h5p-editor';
import { EntityId } from '@shared/domain/types';

export enum H5pEditorEvents {
	DELETE_CONTENT = 'delete-content',
	COPY_CONTENT = 'copy-content',
}

export interface DeleteContentParams {
	contentId: EntityId;
}

export interface CopyContentParams {
	sourceContentId: EntityId;
	copiedContentId: EntityId;
	userId: EntityId;
	schoolId: EntityId;
	parentType: H5PContentParentType;
	parentId: EntityId;
}
