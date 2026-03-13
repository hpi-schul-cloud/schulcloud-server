import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { FileDo } from './do';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { GetFileResponse } from './types';

@Injectable()
export class DownloadArchiveService {
	constructor(private readonly logger: Logger, private readonly legacyFileStorageAdapter: LegacyFileStorageAdapter) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async downloadFilesAsArchive(ownerId: EntityId, archiveName: string): Promise<GetFileResponse> {
		const files = await this.legacyFileStorageAdapter.getFilesForOwner(ownerId);
		const filesById = this.createFileMap(files);
		const downloadableFiles = this.filterDownloadableFiles(files);

		const fileResponses = await this.downloadFiles(downloadableFiles, filesById);

		const archive = ArchiveFactory.create(fileResponses, downloadableFiles, this.logger);

		return FileResponseFactory.createFromArchive(archiveName, archive);
	}

	private createFileMap(files: FileDo[]): Map<EntityId, FileDo> {
		return new Map(files.map((file) => [file.id, file]));
	}

	private filterDownloadableFiles(files: FileDo[]): FileDo[] {
		return files.filter((file) => !file.isDirectory);
	}

	private async downloadFiles(files: FileDo[], filesById: Map<EntityId, FileDo>): Promise<GetFileResponse[]> {
		if (files.length === 0) {
			return [];
		}

		const filePromises = files.map((file) => this.downloadFileWithPath(file, filesById));

		return await Promise.all(filePromises);
	}

	private async downloadFileWithPath(file: FileDo, filesById: Map<EntityId, FileDo>): Promise<GetFileResponse> {
		const data = await this.legacyFileStorageAdapter.downloadFile(file.id, file.name);

		const fileResponse = {
			name: this.buildFilePath(file, filesById),
			data,
		};

		return fileResponse;
	}

	private buildFilePath(file: FileDo, filesById: Map<EntityId, FileDo>): string {
		const pathSegments: string[] = [];
		let currentFile: FileDo | undefined = file;

		while (currentFile) {
			pathSegments.unshift(currentFile.name);
			currentFile = currentFile.parentId ? filesById.get(currentFile.parentId) : undefined;
		}

		return pathSegments.join('/');
	}
}
