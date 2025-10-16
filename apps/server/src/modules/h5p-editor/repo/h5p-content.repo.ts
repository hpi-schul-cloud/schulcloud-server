import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { H5PContent } from './entity';

@Injectable()
export class H5PContentRepo extends BaseRepo<H5PContent> {
	get entityName(): typeof H5PContent {
		return H5PContent;
	}

	public async existsOne(contentId: EntityId): Promise<boolean> {
		const entityCount = await this._em.count(this.entityName, { id: contentId });

		return entityCount === 1;
	}

	public async deleteContent(content: H5PContent): Promise<void> {
		await this.delete(content);
	}

	public async findById(contentId: EntityId): Promise<H5PContent> {
		const content = await this._em.findOneOrFail(this.entityName, { id: contentId });

		return content;
	}

	public async getAllContents(): Promise<H5PContent[]> {
		const contents = await this._em.find(this.entityName, {});

		return contents;
	}
}
