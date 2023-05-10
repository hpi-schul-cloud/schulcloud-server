import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Readable, Stream } from 'stream';
import {
	IContentMetadata,
	IContentStorage,
	IFileStats,
	ILibraryName,
	IUser,
	Permission,
} from '@lumieducation/h5p-server';

@Injectable()
export class ContentStorage implements IContentStorage {
	private deletedFolderName = 'trash';

	constructor(private logger: LegacyLogger) {
		this.logger.setContext(ContentStorage.name);
	}

	addContent(metadata: IContentMetadata, content: any, user: IUser, contentId?: string | undefined): Promise<string> {
		throw new Error('Method not implemented.');
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

	getFileStream(contentId: string, file: string, user: IUser, rangeStart?: number | undefined, rangeEnd?: number | undefined): Promise<Readable> {
		throw new Error('Method not implemented.');
	}

	getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		throw new Error('Method not implemented.');
	}

	getParameters(contentId: string, user?: IUser | undefined): Promise<any> {
		throw new Error('Method not implemented.');
	}

	getUsage(library: ILibraryName): Promise<{ asDependency: number; asMainLibrary: number; }> {
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
}
