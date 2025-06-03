import { EntityId } from '@shared/domain/types';
import { H5PContentParentType } from './h5p-content-parent-type';

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
