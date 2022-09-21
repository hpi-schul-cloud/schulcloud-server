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
		const [entities, count] = await this.embeddedFilesRepo.findElementsToSyncFiles(type, limit, []);

		this.logger.log(`Found ${entities.length} ${type} descriptions with embedded files.`);

		const promises = entities.map(async (entity: AvailableSyncEntityType) => {
			this.logger.log(`migrating entity with id ${entity.id}`);
			const fileIds = this.extractFileIds(entity);
			this.logger.log(`extracted file ids for entity with id ${entity.id} - fileIds: ${JSON.stringify(fileIds)}`);
			if (fileIds.length > 0) {
				const files = await this.embeddedFilesRepo.findFiles(fileIds, entity._id, type);

				const unreachableFileIds: string[] = [];
				fileIds.forEach((id) => {
					const idExists = files.some((file) => file.source.id === id.toHexString());
					if (!idExists) {
						unreachableFileIds.push(id.toHexString());
						this.logger.warn(
							`legacy file with id: ${id.toHexString()} in entity ${entity._id.toHexString()} not found`
						);
					}
				});
				unreachableFileIds.forEach((id) => {
					this.updateEntityLinks(entity, id);
				});

				return this.syncFiles(files, entity);
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
		// eslint-disable-next-line no-restricted-syntax
		for (const file of files) {
			this.updateEntityLinks(entity, file.source.id, file.fileRecord.id, file.fileRecord.name);
		}
		await this.embeddedFilesRepo.updateEntity(entity);
	}

	private async sync(file: SyncFileItem, entity: AvailableSyncEntityType) {
		try {
			this.logger.log(`syncing entity with id ${entity.id}`);
			await this.syncFilesMetaDataService.prepareMetaData(file);
			await this.syncFilesStorageService.syncS3File(file);
			await this.syncFilesMetaDataService.persistMetaData(file);
			this.logger.log(`Synced file ${file.source.id}`);
		} catch (error) {
			if (error instanceof Error && error.message.includes('S3 file not found')) {
				file.fileRecord.name = '';
				file.fileRecord.id = '';
			}
			await this.writeError(error, file.source.id, entity);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
	private async writeError(error: any, sourceFileId: EntityId, entity: AvailableSyncEntityType) {
		const entityId = entity._id.toHexString();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const stack = 'stack' in error ? error.stack : error;
		this.logger.error(`${entityId}`, stack);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return this.syncFilesMetaDataService.persistError(sourceFileId, stack);
	}

	private updateEntityLinks(
		entity: Task | Lesson,
		sourceFileId: string,
		fileRecordId?: string,
		fileRecordName?: string
	) {
		if (entity instanceof Lesson) {
			entity.contents = entity.contents.map((item: IComponentProperties) => {
				if (item.component === 'text' && 'text' in item.content && item.content?.text) {
					item.content.text = this.replaceLink(item.content.text, sourceFileId, fileRecordId, fileRecordName);
				}
				return item;
			});
		} else if (entity instanceof Task && entity?.description) {
			entity.description = this.replaceLink(entity.description, sourceFileId, fileRecordId, fileRecordName);
		} else {
			throw new Error(`no matching condition in updateEntityLinks() for entity ${entity._id.toHexString()}`);
		}
	}

	private replaceLink(text: string, sourceFileId: string, fileRecordId?: string, fileRecordName?: string) {
		let newUrl = '';
		const regex = new RegExp(`${fileUrlRegex}${sourceFileId}.*?"`, 'g');

		if (fileRecordId && fileRecordName) {
			newUrl = `"/api/v3/file/download/${fileRecordId}/${fileRecordName}"`;
		} else {
			newUrl = `"/files/file?file=not-found-${sourceFileId}"`;
		}

		return text.replace(regex, newUrl);
	}
}
