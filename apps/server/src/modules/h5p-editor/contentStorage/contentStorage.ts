import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Readable, Stream } from 'stream';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import {
	ContentId,
	IContentMetadata,
	IContentStorage,
	IFileStats,
	ILibraryName,
	IUser,
	Permission,
} from '@lumieducation/h5p-server';
import path from 'path';

@Injectable()
export class ContentStorage implements IContentStorage {
	private deletedFolderName = 'trash';

	constructor(
		private logger: LegacyLogger,
		protected contentPath: string,
		protected options?: {
			invalidCharactersRegexp?: RegExp;
			maxPathLength?: number;
		}
	) {
		this.logger.setContext(ContentStorage.name);
	}

	public async addContent(
		metadata: IContentMetadata,
		content: any,
		user: IUser,
		contentId?: ContentId | undefined
	): Promise<ContentId> {
		if (contentId === null || contentId === undefined) {
			contentId = this.createContentId();
		}
		try {
			fs.existsSync(path.join(this.getContentPath(), contentId.toString()));
			await this.existsOrCreateDir(contentId);
			await fsPromises.writeFile(
				path.join(this.getContentPath(), contentId.toString(), 'h5p.json'),
				JSON.stringify(metadata)
			);
			await fsPromises.writeFile(
				path.join(this.getContentPath(), contentId.toString(), 'content.json'),
				JSON.stringify(content)
			);
		} catch (error) {
			await fsPromises.rm(path.join(this.getContentPath(), contentId.toString()));
			throw new Error('storage-file-implementations:error-creating-content');
		}
		return contentId;
	}

	addFile(contentId: string, filename: string, readStream: Stream, user?: IUser | undefined): Promise<void> {
		throw new Error('Method not implemented.');
	}

	contentExists(contentId: string): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	deleteContent(contentId: string, user?: IUser | undefined): Promise<void> {
		throw new Error('Method not implemented.');
	}

	deleteFile(contentId: string, filename: string, user?: IUser | undefined): Promise<void> {
		throw new Error('Method not implemented.');
	}

	fileExists(contentId: string, filename: string): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	getFileStats(contentId: string, file: string, user: IUser): Promise<IFileStats> {
		throw new Error('Method not implemented.');
	}

	getFileStream(
		contentId: string,
		file: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		throw new Error('Method not implemented.');
	}

	getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		throw new Error('Method not implemented.');
	}

	getParameters(contentId: string, user?: IUser | undefined): Promise<any> {
		throw new Error('Method not implemented.');
	}

	getUsage(library: ILibraryName): Promise<{ asDependency: number; asMainLibrary: number }> {
		throw new Error('Method not implemented.');
	}

	getUserPermissions(contentId: string, user: IUser): Promise<Permission[]> {
		throw new Error('Method not implemented.');
	}

	listContent(user?: IUser | undefined): Promise<string[]> {
		throw new Error('Method not implemented.');
	}

	listFiles(contentId: string, user: IUser): Promise<string[]> {
		throw new Error('Method not implemented.');
	}

	sanitizeFilename?(filename: string): string {
		throw new Error('Method not implemented.');
	}

	// own methods

	protected createContentId() {
		let counter = 0;
		let id: number;
		let exists = false;
		do {
			id = ContentStorage.getRandomId(1, 2 ** 32);
			counter += 1;
			const p = path.join(this.getContentPath(), id.toString());
			exists = fs.existsSync(p);
		} while (exists && counter < 5); // try 5x and give up then
		if (exists) {
			throw new Error('storage-file-implementations:error-generating-content-id');
		}
		return id.toString();
	}

	private static getRandomId(min: number, max: number): number {
		const finalMin = Math.ceil(min);
		const finalMax = Math.floor(max);
		return Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;
	}

	protected getContentPath(): string {
		return this.contentPath;
	}

	private async existsOrCreateDir(contentId: ContentId) {
		try {
			await fsPromises.access(path.join(this.getContentPath(), contentId.toString()));
		} catch (error) {
			await fsPromises.mkdir(path.join(this.getContentPath(), contentId.toString()));
		}
	}
}
