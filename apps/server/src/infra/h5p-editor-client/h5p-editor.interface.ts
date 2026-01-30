import { EntityId } from '@shared/domain/types';

export enum H5pEditorEvents {
	DELETE_CONTENT = 'delete-content',
	COPY_CONTENT = 'copy-content',
}

export interface DeleteContentParams {
	contentId: EntityId;
}

export enum CopyContentParentType {
	Lesson = 'lessons',
	BoardElement = 'board-element',
}

export interface CopyContentParams {
	sourceContentId: EntityId;
	copiedContentId: EntityId;
	userId: EntityId;
	schoolId: EntityId;
	parentType: CopyContentParentType;
	parentId: EntityId;
}
