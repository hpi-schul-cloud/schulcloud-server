import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { H5PContent } from '../entity';

@Injectable()
export class H5PContentRepo extends BaseRepo<H5PContent> {
	get entityName() {
		return H5PContent;
	}

	async deleteContent(content: H5PContent): Promise<void> {
		return this.delete(content);
	}

	async findById(contentId: EntityId): Promise<H5PContent> {
		return this._em.findOneOrFail(this.entityName, { id: contentId });
	}

	async getAllContents(): Promise<H5PContent[]> {
		return this._em.find(this.entityName, {});
	}
}
