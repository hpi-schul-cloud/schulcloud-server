import { Logger } from '@infra/logger';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Archiver } from 'archiver';
import { Readable } from 'node:stream';

import { FileDo } from './do';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { FixedSizeStream } from './fixed-size.stream';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { SkipFileLoggable } from './loggable/skip-file.loggable';
import { GetFileResponse } from './types';
import { ZipSizeCalculator, type ZipEntrySize } from './zip-size.calculator';

const REPORT_ENTRY_BASE_NAME = 'REPORT';
const PROBE_CONCURRENCY = 10;

interface PlannedEntry {
	file: FileDo;
	path: string;
}

interface ArchiveEntry extends PlannedEntry {
	url: string;
	size?: number;
}

interface ArchiveReport {
	name: string;
	content: Buffer;
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

		const planned = filesToDownload.map((file) => {
			return { file, path: this.buildFilePath(file, filesById) };
		});
		// Unreachable files are detected before a size is announced, so they cannot invalidate the Content-Length.
		const { entries, missingFileNames } = await this.probeEntries(planned);
		const report = this.buildReport(planned, missingFileNames);
		const contentLength = this.calculateContentLength(entries, report);

		const archive = ArchiveFactory.createEmpty(
			entries.map((entry) => entry.file),
			this.logger
		);
		this.populateArchiveAndFinalize(archive, entries, report, contentLength !== undefined).catch((err: unknown) =>
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

	private async probeEntries(
		planned: PlannedEntry[]
	): Promise<{ entries: ArchiveEntry[]; missingFileNames: string[] }> {
		const probed = await this.mapWithConcurrency<PlannedEntry, ArchiveEntry | undefined>(
			planned,
			PROBE_CONCURRENCY,
			async (entry) => {
				try {
					const { url, size } = await this.legacyFileStorageAdapter.probeFile(entry.file.id, entry.file.name);

					return { ...entry, url, size };
				} catch (error: unknown) {
					this.logger.warning(new SkipFileLoggable(entry.file.id, this.describeError(error)));

					return undefined;
				}
			}
		);

		const entries = probed.filter((entry): entry is ArchiveEntry => entry !== undefined);
		const missingFileNames = planned.filter((_, index) => probed[index] === undefined).map((entry) => entry.file.name);

		// A complete failure points at a storage or network outage rather than at missing files.
		if (planned.length > 0 && entries.length === 0) {
			throw new InternalServerErrorException('None of the requested files could be accessed');
		}

		return { entries, missingFileNames };
	}

	private describeError(error: unknown): string {
		return error instanceof Error ? error.message : 'unknown error';
	}

	private async mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
		const results = new Array<R>(items.length);
		let nextIndex = 0;

		const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex;
				nextIndex += 1;
				results[index] = await worker(items[index]);
			}
		});
		await Promise.all(runners);

		return results;
	}

	private buildReport(planned: PlannedEntry[], missingFileNames: string[]): ArchiveReport | undefined {
		if (missingFileNames.length === 0) {
			return undefined;
		}

		const header =
			'Folgende Datei(en) konnten nicht heruntergeladen werden / The following files could not be downloaded:';
		const content = Buffer.from(`${header}\n\n${missingFileNames.join('\n')}\n`, 'utf8');

		return { name: this.resolveReportName(planned), content };
	}

	/** Extractors hide or overwrite duplicate zip members, so the report must not clash with a user file. */
	private resolveReportName(planned: PlannedEntry[]): string {
		const takenPaths = new Set(planned.map((entry) => entry.path.toLowerCase()));

		let name = `${REPORT_ENTRY_BASE_NAME}.txt`;
		let index = 1;
		while (takenPaths.has(name.toLowerCase())) {
			name = `${REPORT_ENTRY_BASE_NAME}_${index}.txt`;
			index += 1;
		}

		return name;
	}

	private calculateContentLength(entries: ArchiveEntry[], report?: ArchiveReport): number | undefined {
		const sizes: ZipEntrySize[] = [];

		for (const entry of entries) {
			if (entry.size === undefined) {
				return undefined;
			}
			sizes.push({ name: entry.path, size: entry.size });
		}

		if (report) {
			sizes.push({ name: report.name, size: report.content.length });
		}

		return ZipSizeCalculator.storedArchiveSize(sizes);
	}

	private async populateArchiveAndFinalize(
		archive: Archiver,
		entries: ArchiveEntry[],
		report: ArchiveReport | undefined,
		exactSize: boolean
	): Promise<void> {
		for (const entry of entries) {
			await this.appendEntry(archive, entry, exactSize ? entry.size : undefined);
		}

		if (report) {
			archive.append(Readable.from([report.content]), { name: report.name });
		}

		await archive.finalize();
	}

	private async appendEntry(archive: Archiver, entry: ArchiveEntry, exactSize?: number): Promise<void> {
		const source = await this.openEntry(entry, exactSize !== undefined);

		if (source === undefined) {
			return;
		}

		const data = exactSize === undefined ? source : this.toFixedSizeStream(source, exactSize);
		await this.appendAndWaitForEntry(archive, { name: entry.path, data });
	}

	/** Falls back to an empty stream when a size was already announced, so the padding keeps the Content-Length valid. */
	private async openEntry(entry: ArchiveEntry, exactSize: boolean): Promise<Readable | undefined> {
		try {
			return await this.download(entry);
		} catch (error: unknown) {
			this.logger.warning(new SkipFileLoggable(entry.file.id, this.describeError(error)));

			return exactSize ? Readable.from([]) : undefined;
		}
	}

	private async download(entry: ArchiveEntry): Promise<Readable> {
		try {
			return await this.legacyFileStorageAdapter.downloadFileFromUrl(entry.url);
		} catch {
			// The signed url from the probe may have expired while earlier entries were streamed.
			return this.legacyFileStorageAdapter.downloadFile(entry.file.id, entry.file.name);
		}
	}

	private toFixedSizeStream(source: Readable, size: number): FixedSizeStream {
		const fixedSize = new FixedSizeStream(size);

		// A broken source must not abort the archive, the entry is padded instead so the announced size still matches.
		source.on('error', () => fixedSize.end());
		source.pipe(fixedSize);

		return fixedSize;
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
