/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IComponentProperties, Lesson, Task } from '@shared/domain';
import { Logger } from '@src/core/logger/logger.service';
import _ from 'lodash';
import { EmbeddedFilesRepo, fileIdRegex, fileUrlRegex } from '../repo/embedded-files.repo';
import { AvailableSyncEntityType, AvailableSyncParentType, SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class SyncEmbeddedFilesUc {
	failedEntityIds: ObjectId[] = [];

	private failedFileIds: Map<string, EntityId[]> = new Map();

	constructor(
		private embeddedFilesRepo: EmbeddedFilesRepo,
		private logger: Logger,
		private syncFilesMetaDataService: SyncFilesMetadataService,
		private syncFilesStorageService: SyncFilesStorageService
	) {}

	async syncFilesForParentType(type: AvailableSyncParentType, limit = 1000) {
		await this.embeddedFilesRepo.createBackUpCollection(type);
		await this.syncEmbeddedFiles(type, limit);
	}

	private async syncEmbeddedFiles(type: AvailableSyncParentType, limit: number) {
		const [entities, count] = await this.embeddedFilesRepo.findElementsToSyncFiles(type, limit, this.failedEntityIds);

		this.logger.log(`Found ${entities.length} ${type} descriptions with embedded files.`);

		const promises = entities.map(async (entity: AvailableSyncEntityType) => {
			this.logger.log(`migrating entity with id ${entity.id}`);
			const fileIds = this.extractFileIds(entity);
			this.logger.log(`extracted file ids for entity with id ${entity.id} - fileIds: ${JSON.stringify(fileIds)}`);
			if (fileIds.length > 0) {
				const files = await this.embeddedFilesRepo.findFiles(fileIds, entity._id, type);

				fileIds.forEach((id) => {
					const idExists = files.some((file) => file.source.id === id.toHexString());
					if (!idExists) {
						this.failedEntityIds.push(entity._id);
						this.setErrorFile(entity._id, id);
						this.logger.error(
							`legacy file with id: ${id.toHexString()} in entity ${entity._id.toHexString()} not found`
						);
					}
				});

				return this.syncFiles(files, entity);
				// eslint-disable-next-line no-else-return
			} else {
				this.failedEntityIds.push(entity._id);
				// eslint-disable-next-line consistent-return, no-useless-return
				return;
			}
		});

		await Promise.all(promises);
		if (count > 0) {
			await this.syncEmbeddedFiles(type, limit);
		}
		return true;
	}

	private extractFileIds(entity: AvailableSyncEntityType): ObjectId[] {
		const fileIds: string[] = [];

		if (entity instanceof Lesson) {
			entity.contents.forEach((item: IComponentProperties) => {
				if (item.component === 'text' && 'text' in item.content && item.content?.text) {
					const contentFileIds = this.extractFileIdsFromContent(item.content.text);
					if (contentFileIds !== null) {
						fileIds.push(...contentFileIds);
					}
				}
			});
		}
		if (entity instanceof Task) {
			const contentFileIds = this.extractFileIdsFromContent(entity.description);

			if (contentFileIds !== null) {
				fileIds.push(...contentFileIds);
			}
		}

		const objectIds = _.uniq(fileIds)
			// eslint-disable-next-line array-callback-return, consistent-return
			.map((id) => {
				try {
					return new ObjectId(id);
				} catch (error) {
					this.failedEntityIds.push(entity._id);
					this.logger.error(`The file id ${id} is not ObjectId in entity ${entity._id.toHexString()}`);
				}
			})
			.filter((item): item is ObjectId => !!item);

		return objectIds;
	}

	private extractFileIdsFromContent(text: string) {
		const regEx = new RegExp(`(?<=src=${fileUrlRegex})${fileIdRegex}`, 'gi');
		const contentFileIds = text.match(regEx);

		return contentFileIds;
	}

	private async syncFiles(files: SyncFileItem[], entity: AvailableSyncEntityType) {
		const promises = files.map((file) => this.sync(file, entity));
		await Promise.all(promises);
		await this.embeddedFilesRepo.updateEntity(entity);
	}

	private async sync(file: SyncFileItem, entity: AvailableSyncEntityType) {
		try {
			this.logger.log(`syncing entity with id ${entity.id}`);
			await this.syncFilesMetaDataService.prepareMetaData(file);
			await this.syncFilesStorageService.syncS3File(file);
			await this.syncFilesMetaDataService.persistMetaData(file);
			this.updateEntityLinks(file, entity);
			this.logger.log(`Synced file ${file.source.id}`);
		} catch (error) {
			if ((error = '')) {
				this.setErrorFile(entity._id, file.source.id);
				this.updateEntityLinks(file, entity);
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			await this.writeError(error, file.source.id, entity);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
	private async writeError(error: Error, sourceFileId: EntityId, entity: AvailableSyncEntityType) {
		const entityId = entity._id.toHexString();
		const stack = 'stack' in error ? error.stack : JSON.stringify(error);
		this.logger.error(`${entityId}`, stack);
		this.failedEntityIds.push(entity._id);
		return this.syncFilesMetaDataService.persistError(sourceFileId, stack);
	}

	private setErrorFile(entityId: ObjectId, sourceFileId: ObjectId) {
		const result = this.failedFileIds.get(entityId.toHexString());
		if (result) {
			this.failedFileIds.set(entityId.toHexString(), [...result, sourceFileId.toHexString()]);
		}
	}

	private updateEntityLinks(file: SyncFileItem, entity: Task | Lesson) {
		if (entity instanceof Lesson) {
			entity.contents = entity.contents.map((item: IComponentProperties) => {
				if (item.component === 'text' && 'text' in item.content && item.content?.text) {
					item.content.text = this.replaceLink(item.content.text, file, entity.id);
				}
				return item;
			});
		} else if (entity instanceof Task && entity?.description) {
			entity.description = this.replaceLink(entity.description, file, entity.id);
		} else {
			throw new Error(`no matching condition in updateEntityLinks() for entity ${entity._id.toHexString()}`);
		}
	}

	private replaceLink(text: string, file: SyncFileItem, entityId: string) {
		let newUrl = '';
		const sourceFileId = file.source.id;
		const regex = new RegExp(`${fileUrlRegex}${sourceFileId}.*?"`, 'g');

		const record = this.failedFileIds.get(entityId);
		if (record && record.includes(sourceFileId)) {
			newUrl = `"/files/file?file=not-found-${sourceFileId}"`;
		} else {
			newUrl = `"/api/v3/file/download/${file.fileRecord.id}/${file.fileRecord.name}"`;
		}

		return text.replace(regex, newUrl);
	}
}
