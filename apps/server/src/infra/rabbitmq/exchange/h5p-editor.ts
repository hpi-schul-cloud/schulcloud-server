import { EntityId } from '@shared/domain/types';

export enum H5pEditorEvents {
	DELETE_CONTENT = 'delete-content',
}

export interface DeleteContentParams {
	contentId: EntityId;
}
