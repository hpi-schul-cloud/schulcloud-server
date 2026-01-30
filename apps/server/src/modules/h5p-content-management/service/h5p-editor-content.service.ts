import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { isMongoId } from 'class-validator';
import { H5pEditorContentInvalidIdLoggableException } from '../loggable';
import { H5PContent, H5PContentRepo } from '../repo';
import { H5PContentParentType } from '../types';
import { ContentStorage } from './content-storage.service';

export type H5pCopyContentParams = {
	sourceContentId: EntityId;
	copiedContentId: EntityId;
	creatorId: EntityId;
	schoolId: EntityId;
	parentType: H5PContentParentType;
	parentId: EntityId;
};

@Injectable()
export class H5pEditorContentService {
	constructor(private readonly h5PContentRepo: H5PContentRepo, private readonly contentStorage: ContentStorage) {}

	public async copyH5pContent(params: H5pCopyContentParams): Promise<void> {
		if (!isMongoId(params.copiedContentId)) {
			throw new H5pEditorContentInvalidIdLoggableException(params.copiedContentId);
		}

		const sourceContent: H5PContent = await this.h5PContentRepo.findById(params.sourceContentId);
		const copiedContent = new H5PContent({
			...sourceContent,
			...params,
			id: params.copiedContentId,
		});

		await this.h5PContentRepo.save(copiedContent);

		try {
			await this.contentStorage.copyAllFiles(params.sourceContentId, params.copiedContentId);
		} catch (error: unknown) {
			await this.h5PContentRepo.deleteContent(copiedContent);
			throw error;
		}
	}
}
