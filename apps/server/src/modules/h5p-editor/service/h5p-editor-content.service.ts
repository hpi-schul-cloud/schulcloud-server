import { CopyContentParams } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
// TODO dep inversion for repo
import { H5PContentRepo } from '../repo';
import { H5PContent } from '../entity';
import { ContentStorage } from './content-storage.service';

@Injectable()
export class H5pEditorContentService {
	constructor(private readonly h5PContentRepo: H5PContentRepo, private readonly contentStorage: ContentStorage) {}

	public async copyH5pContent(params: CopyContentParams): Promise<void> {
		const sourceContent: H5PContent = await this.h5PContentRepo.findById(params.sourceContentId);
		const copiedContent = new H5PContent({
			...sourceContent,
			id: params.copiedContentId,
			creatorId: params.userId,
			schoolId: params.schoolId,
			parentId: params.parentId,
			parentType: params.parentType,
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
