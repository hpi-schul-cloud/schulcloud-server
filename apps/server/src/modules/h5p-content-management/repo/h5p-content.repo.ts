import { ILibraryName } from '@lumieducation/h5p-server';
import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { H5PCountUsageResult } from '../types';
import { H5PContent } from './entity';

@Injectable()
export class H5PContentRepo extends BaseRepo<H5PContent> {
	get entityName(): EntityName<H5PContent> {
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

	public async countUsage(library: ILibraryName): Promise<H5PCountUsageResult> {
		const { machineName } = library;

		const pipeline = [
			{
				$facet: {
					asMainLibrary: [{ $match: { metadata_mainLibrary: machineName } }, { $count: 'count' }],
					asDependency: [
						{
							$match: {
								$or: [
									{ 'metadata_preloadedDependencies.machineName': machineName },
									{ 'metadata_editorDependencies.machineName': machineName },
									{ 'metadata_dynamicDependencies.machineName': machineName },
								],
								metadata_mainLibrary: { $ne: machineName },
							},
						},
						{ $count: 'count' },
					],
				},
			},
			{
				$project: {
					asMainLibrary: { $ifNull: [{ $arrayElemAt: ['$asMainLibrary.count', 0] }, 0] },
					asDependency: { $ifNull: [{ $arrayElemAt: ['$asDependency.count', 0] }, 0] },
				},
			},
		];

		const documents = await this._em.getConnection().getCollection('h5p-editor-content').aggregate(pipeline).toArray();

		return this.castToH5PCountUsageResult(documents[0]);
	}

	private castToH5PCountUsageResult(aggregateResult: unknown): H5PCountUsageResult {
		if (this.isH5PCountUsageResult(aggregateResult)) {
			return aggregateResult;
		}

		throw new Error('Invalid dependency count result structure');
	}

	private isH5PCountUsageResult(aggregateResult: unknown): aggregateResult is H5PCountUsageResult {
		const isH5PCountUsageResult =
			typeof aggregateResult === 'object' &&
			aggregateResult !== null &&
			'asMainLibrary' in aggregateResult &&
			'asDependency' in aggregateResult &&
			typeof aggregateResult.asMainLibrary === 'number' &&
			typeof aggregateResult.asDependency === 'number';

		return isH5PCountUsageResult;
	}
}
