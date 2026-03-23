import { Logger } from '@core/logger';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Archiver } from 'archiver';

import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../legacy-file-archive.config';
import { FileDo } from './do';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { GetFileResponse } from './types';

@Injectable()
export class DownloadArchiveService {
	constructor(
		private readonly logger: Logger,
		private readonly legacyFileStorageAdapter: LegacyFileStorageAdapter,
		@Inject(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN) private readonly config: LegacyFileArchiveConfig
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async downloadFilesAsArchive(ownerId: EntityId, archiveName: string): Promise<GetFileResponse> {
		const files = await this.legacyFileStorageAdapter.getFilesForOwner(ownerId);
		const filesById = this.createFileMap(files);
		const downloadableFiles = this.filterDownloadableFiles(files);

		const archive = ArchiveFactory.createEmpty(downloadableFiles, this.logger);
		this.populateArchiveAndFinalize(archive, downloadableFiles, filesById).catch((err: unknown) =>
			archive.emit('error', err as Error)
		);

		return FileResponseFactory.createFromArchive(archiveName, archive);
	}

	private createFileMap(files: FileDo[]): Map<EntityId, FileDo> {
		return new Map(files.map((file) => [file.id, file]));
	}

	private filterDownloadableFiles(files: FileDo[]): FileDo[] {
		return files.filter((file) => !file.isDirectory);
	}

	private async populateArchiveAndFinalize(
		archive: Archiver,
		files: FileDo[],
		filesById: Map<EntityId, FileDo>
	): Promise<void> {
		const { concurrencyLimit } = this.config;

		for (let i = 0; i < files.length; i += concurrencyLimit) {
			const batch = files.slice(i, i + concurrencyLimit);
			await Promise.all(
				batch.map(async (file) => {
					const fileResponse = await this.downloadFileWithPath(file, filesById);
					ArchiveFactory.appendFile(archive, fileResponse);
				})
			);
		}

		await archive.finalize();
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
			pathSegments.unshift(currentFile.sanitizedName);
			currentFile = currentFile.parentId ? filesById.get(currentFile.parentId) : undefined;
		}

		return pathSegments.join('/');
	}
}
