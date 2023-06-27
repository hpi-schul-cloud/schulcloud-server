import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { ContentMetadata } from './contentMetadata.entity';

@Injectable()
export class ContentMetadataRepo extends BaseRepo<ContentMetadata> {
	get entityName() {
		return ContentMetadata;
	}

	async createContentMetadata(contentMetadata: ContentMetadata): Promise<void> {
		const cmEm = this.create(contentMetadata);
		return this.save(cmEm);
	}

	async deleteContentMetadata(contentMetadata: ContentMetadata): Promise<void> {
		return this.delete(contentMetadata);
	}

	async findById(contentId: string): Promise<ContentMetadata> {
		return this._em.findOneOrFail(this.entityName, { contentId });
	}

	async getAllMetadata(): Promise<ContentMetadata[]> {
		return this._em.find(this.entityName, {});
	}
}
