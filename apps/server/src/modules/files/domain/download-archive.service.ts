import { Logger } from '@infra/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Archiver } from 'archiver';
import { Readable } from 'node:stream';

import { FileDo } from './do';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { FixedSizeStream } from './fixed-size.stream';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { SkipFileLoggable } from './loggable/skip-file.loggable';
import { GetFileResponse } from './types';
import { ZipSizeCalculator } from './zip-size.calculator';

const REPORT_ENTRY_NAME = 'REPORT.txt';
const REPORT_RESERVED_SIZE = 4096;

interface ArchiveEntry {
	file: FileDo;
	path: string;
	size?: number;
}

interface AppendResult {
	problem?: string;
	deficit: number;
}

@Injectable()
export class DownloadArchiveService {
	constructor(
		private readonly logger: Logger,
		private readonly legacyFileStorageAdapter: LegacyFileStorageAdapter
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async downloadFilesAsArchive(
		ownerId: EntityId,
		archiveName: string,
		selectedFiles?: string[]
	): Promise<GetFileResponse> {
		const files = await this.legacyFileStorageAdapter.getFilesForOwner(ownerId);
		const filesById = this.createFileMap(files);
		const downloadableFiles = this.filterDownloadableFiles(files);
		const filesToDownload = this.filterSelectedFiles(downloadableFiles, selectedFiles);

		const entries = filesToDownload.map((file) => {
			return {
				file,
				path: this.buildFilePath(file, filesById),
				size: file.size,
			};
		});
		const contentLength = this.calculateContentLength(entries);

		const archive = ArchiveFactory.createEmpty(filesToDownload, this.logger);
		this.populateArchiveAndFinalize(archive, entries, contentLength !== undefined).catch((err: unknown) =>
			archive.emit('error', err as Error)
		);

		return FileResponseFactory.createFromArchive(archiveName, archive, contentLength);
	}

	public async listDownloadableFiles(ownerId: EntityId): Promise<FileDo[]> {
		const files = await this.legacyFileStorageAdapter.getFilesForOwner(ownerId);

		return files;
	}

	private createFileMap(files: FileDo[]): Map<EntityId, FileDo> {
		return new Map(files.map((file) => [file.id, file]));
	}

	private filterDownloadableFiles(files: FileDo[]): FileDo[] {
		return files.filter((file) => !file.isDirectory);
	}

	private filterSelectedFiles(files: FileDo[], selectedFiles?: string[]): FileDo[] {
		if (!selectedFiles || selectedFiles.length === 0) {
			return files;
		}

		const selectedFileSet = new Set(selectedFiles);
		return files.filter((file) => selectedFileSet.has(file.id));
	}

	private calculateContentLength(entries: ArchiveEntry[]): number | undefined {
		if (entries.some((entry) => entry.size === undefined)) {
			return undefined;
		}

		const sizes = entries.map((entry) => {
			return { name: entry.path, size: entry.size ?? 0 };
		});
		sizes.push({ name: REPORT_ENTRY_NAME, size: REPORT_RESERVED_SIZE });

		return ZipSizeCalculator.storedArchiveSize(sizes);
	}

	private async populateArchiveAndFinalize(
		archive: Archiver,
		entries: ArchiveEntry[],
		exactSize: boolean
	): Promise<void> {
		const { problems, deficit } = await this.populateArchive(archive, entries, exactSize);

		if (exactSize) {
			this.appendReport(archive, problems, REPORT_RESERVED_SIZE + deficit);
		} else if (problems.length > 0) {
			this.appendReport(archive, problems);
		}

		await archive.finalize();
	}

	private async populateArchive(
		archive: Archiver,
		entries: ArchiveEntry[],
		exactSize: boolean
	): Promise<{ problems: string[]; deficit: number }> {
		const problems: string[] = [];
		let deficit = 0;

		for (const entry of entries) {
			const result = await this.tryAppendEntry(archive, entry, exactSize);
			if (result.problem) problems.push(result.problem);
			deficit += result.deficit;
		}

		return { problems, deficit };
	}

	private async tryAppendEntry(archive: Archiver, entry: ArchiveEntry, exactSize: boolean): Promise<AppendResult> {
		try {
			const data = await this.legacyFileStorageAdapter.downloadFile(entry.file.id, entry.file.name);

			if (!exactSize) {
				await this.appendAndWaitForEntry(archive, { name: entry.path, data });

				return { deficit: 0 };
			}

			const fixedSize = this.toFixedSizeStream(data, entry.size ?? 0);
			await this.appendAndWaitForEntry(archive, { name: entry.path, data: fixedSize });

			return fixedSize.isExact ? { deficit: 0 } : { problem: entry.file.name, deficit: 0 };
		} catch {
			this.logger.warning(new SkipFileLoggable(entry.file.id));

			// The skipped entry is missing from the announced Content-Length and gets compensated by the report entry.
			const deficit = exactSize ? ZipSizeCalculator.streamedEntrySize(entry.path, entry.size ?? 0) : 0;

			return { problem: entry.file.name, deficit };
		}
	}

	private toFixedSizeStream(source: Readable, size: number): FixedSizeStream {
		const fixedSize = new FixedSizeStream(size);

		// A broken source must not abort the archive, the entry is padded instead so the announced size still matches.
		source.on('error', () => fixedSize.end());
		source.pipe(fixedSize);

		return fixedSize;
	}

	private appendReport(archive: Archiver, problemFileNames: string[], exactSize?: number): void {
		const content = Buffer.from(this.buildReportContent(problemFileNames), 'utf8');
		const source = Readable.from([content]);
		const data = exactSize === undefined ? source : this.toFixedSizeStream(source, exactSize);

		archive.append(data, { name: REPORT_ENTRY_NAME });
	}

	private buildReportContent(problemFileNames: string[]): string {
		if (problemFileNames.length === 0) {
			return 'Alle Dateien wurden vollständig heruntergeladen. / All files were downloaded completely.\n';
		}

		const header =
			'Folgende Datei(en) konnten nicht (vollständig) heruntergeladen werden / The following files could not be downloaded (completely):';

		return `${header}\n\n${problemFileNames.join('\n')}\n`;
	}

	private appendAndWaitForEntry(archive: Archiver, fileResponse: GetFileResponse): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const onEntry = (): void => {
				archive.off('error', onError);
				resolve();
			};
			const onError = (err: Error): void => {
				archive.off('entry', onEntry);
				reject(err);
			};
			archive.once('entry', onEntry);
			archive.once('error', onError);
			ArchiveFactory.appendFile(archive, fileResponse);
		});
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
