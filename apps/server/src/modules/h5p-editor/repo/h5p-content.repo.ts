import { ILibraryName } from '@lumieducation/h5p-server';
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

	public async countUsage(library: ILibraryName): Promise<{ asMainLibrary: number; asDependency: number }> {
		const { machineName } = library;

		const pipeline = [
			{
				$facet: {
					asMainLibrary: [{ $match: { 'metadata.mainLibrary': machineName } }, { $count: 'count' }],
					asDependency: [
						{
							$match: {
								$or: [
									{ 'metadata.preloadedDependencies.machineName': machineName },
									{ 'metadata.editorDependencies.machineName': machineName },
									{ 'metadata.dynamicDependencies.machineName': machineName },
								],
								'metadata.mainLibrary': { $ne: machineName },
							},
						},
						{ $count: 'count' },
					],
				},
			},
			{
				$project: {
					asMainLibrary: { $arrayElemAt: ['$asMainLibrary.count', 0] },
					asDependency: { $arrayElemAt: ['$asDependency.count', 0] },
				},
			},
		];

		const documents = await this._em.getConnection().getCollection('h5p-editor-content').aggregate(pipeline).toArray();

		if (documents.length === 0) {
			return { asMainLibrary: 0, asDependency: 0 };
		}

		if (documents.length > 1) {
			throw new Error('Unexpected aggregation result structure.');
		}

		if (!documents[0].asMainLibrary) {
			documents[0].asMainLibrary = 0;
		}

		if (!documents[0].asDependency) {
			documents[0].asDependency = 0;
		}

		return documents[0] as { asMainLibrary: number; asDependency: number };
	}
}
