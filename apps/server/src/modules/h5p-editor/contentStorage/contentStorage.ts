/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ContentId,
	IContentMetadata,
	IContentStorage,
	IFileStats,
	ILibraryName,
	IUser,
	LibraryName,
	Permission,
	streamToString,
} from '@lumieducation/h5p-server';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FileDto } from '@src/modules/files-storage/dto';
import { Readable } from 'stream';
import { S3ClientAdapter } from '../../files-storage/client/s3-client.adapter';
import { H5PContent } from './h5p-content.entity';
import { H5PContentRepo } from './h5p-content.repo';

@Injectable()
export class ContentStorage implements IContentStorage {
	constructor(private readonly repo: H5PContentRepo, private readonly storageClient: S3ClientAdapter) {}

	public async addContent(
		metadata: IContentMetadata,
		content: string | undefined,
		user: IUser,
		contentId?: ContentId | undefined
	): Promise<ContentId> {
		if (!metadata.defaultLanguage) {
			metadata.defaultLanguage = metadata.language;
		}

		try {
			let h5pContent: H5PContent;

			if (contentId) {
				h5pContent = await this.repo.findById(contentId);
				h5pContent.metadata = metadata;
				h5pContent.content = content;
				await this.repo.save(h5pContent);
			} else {
				h5pContent = new H5PContent({ metadata, content });
				await this.repo.createContent(h5pContent);
			}

			return h5pContent.id;
		} catch (error) {
			throw new InternalServerErrorException(error, 'ContentStorage:addContent');
		}
	}

	public async addFile(contentId: string, filename: string, stream: Readable, user?: IUser): Promise<void> {
		this.checkFilename(filename);

		if (!(await this.contentExists(contentId))) {
			throw new NotFoundException('The content does not exist');
		}

		const fullPath = this.getFilePath(contentId, filename);
		const file: FileDto = {
			name: filename,
			data: stream,
			mimeType: 'application/json',
		};

		await this.storageClient.create(fullPath, file);
	}

	public async contentExists(contentId: string): Promise<boolean> {
		try {
			await this.repo.findById(contentId);
			return true;
		} catch (error) {
			return false;
		}
	}

	public async deleteContent(contentId: string, user?: IUser): Promise<void> {
		try {
			const h5pContent = await this.repo.findById(contentId);

			const fileList = await this.listFiles(contentId, user);
			const fileDeletePromises = fileList.map((file) => this.deleteFile(contentId, file));

			await Promise.all([this.repo.delete(h5pContent), ...fileDeletePromises]);
		} catch (error) {
			throw new InternalServerErrorException(error, 'ContentStorage:deleteContent');
		}
	}

	public async deleteFile(contentId: string, filename: string, user?: IUser | undefined): Promise<void> {
		this.checkFilename(filename);
		const filePath = this.getFilePath(contentId, filename);
		await this.storageClient.delete([filePath]);
	}

	public fileExists(contentId: string, filename: string): Promise<boolean> {
		this.checkFilename(filename);

		const filePath = this.getFilePath(contentId, filename);

		return this.exists(filePath);
	}

	public async getFileStats(contentId: string, file: string, user: IUser): Promise<IFileStats> {
		const filePath = this.getFilePath(contentId, file);
		const fileResponse = await this.storageClient.get(filePath);

		const fileSize = fileResponse.contentLength ?? 0;
		const date = new Date('01.01.01');
		const fileStats: IFileStats = {
			birthtime: date,
			size: fileSize,
		};

		return fileStats;
	}

	public async getFileStream(
		contentId: string,
		file: string,
		user: IUser,
		rangeStart?: number,
		rangeEnd?: number
	): Promise<Readable> {
		const filePath = this.getFilePath(contentId, file);

		if (rangeStart !== undefined && rangeEnd !== undefined) {
			const fileResponse = await this.storageClient.get(filePath, `${rangeStart}-${rangeEnd}`);
			return fileResponse.data;
		}

		const fileResponse = await this.storageClient.get(filePath);
		return fileResponse.data;
	}

	public async getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		const h5pContent = await this.repo.findById(contentId);
		return h5pContent.metadata;
	}

	public async getParameters(contentId: string, user?: IUser | undefined): Promise<unknown> {
		const h5pContent = await this.repo.findById(contentId);
		return h5pContent.content;
	}

	public async getUsage(library: ILibraryName): Promise<{ asDependency: number; asMainLibrary: number }> {
		const defaultUser: IUser = {
			canCreateRestricted: false,
			canInstallRecommended: false,
			canUpdateAndInstallLibraries: false,
			email: '',
			id: '',
			name: 'getUsage',
			type: '',
		};

		const contentIds = await this.listContent();
		const result = await this.resolveDependecies(contentIds, defaultUser, library);
		return result;
	}

	public getUserPermissions(contentId: string, user: IUser): Promise<Permission[]> {
		const permission = [Permission.Delete, Permission.Download, Permission.Edit, Permission.Embed, Permission.View];

		return Promise.resolve(permission);
	}

	public async listContent(user?: IUser): Promise<string[]> {
		const contentList = await this.repo.getAllContents();

		const contentIDs = contentList.map((c) => c.id);
		return contentIDs;
	}

	public async listFiles(contentId: string, user?: IUser): Promise<string[]> {
		const prefix = this.getContentPath(contentId);
		const files = await this.storageClient.list(prefix);
		return files;
	}

	private async exists(checkPath: string): Promise<boolean> {
		try {
			const file = await this.storageClient.get(checkPath);
			file.data.destroy();
		} catch (error) {
			if (error instanceof NotFoundException) {
				return false;
			}

			throw new InternalServerErrorException(error, 'ContentStorage:exists');
		}

		return true;
	}

	private hasDependencyOn(
		metadata: {
			dynamicDependencies?: ILibraryName[];
			editorDependencies?: ILibraryName[];
			preloadedDependencies: ILibraryName[];
		},
		library: ILibraryName
	): boolean {
		if (
			metadata.preloadedDependencies.some((dep) => LibraryName.equal(dep, library)) ||
			metadata.editorDependencies?.some((dep) => LibraryName.equal(dep, library)) ||
			metadata.dynamicDependencies?.some((dep) => LibraryName.equal(dep, library))
		) {
			return true;
		}
		return false;
	}

	async resolveDependecies(contentIds: string[], user: IUser, library: ILibraryName) {
		let asDependency = 0;
		let asMainLibrary = 0;

		const contentMetadataList = await Promise.all(contentIds.map((id) => this.getMetadata(id, user)));

		for (const contentMetadata of contentMetadataList) {
			const isMainLibrary = contentMetadata.mainLibrary === library.machineName;
			if (this.hasDependencyOn(contentMetadata, library)) {
				if (isMainLibrary) {
					asMainLibrary += 1;
				} else {
					asDependency += 1;
				}
			}
		}

		return { asMainLibrary, asDependency };
	}

	private checkFilename(filename: string): void {
		filename = filename.split('.').slice(0, -1).join('.');
		if (/^[a-zA-Z0-9/._-]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters ${filename}`);
	}

	private async getJsonData(fileStream: Readable): Promise<unknown> {
		const body = await streamToString(fileStream);
		return JSON.parse(body) as unknown;
	}

	private getContentPath(contentId: string): string {
		if (!contentId) {
			throw new Error('COULD_NOT_CREATE_PATH');
		}

		const path = `h5p/${contentId}/`;
		return path;
	}

	private getFilePath(contendId: string, filename: string): string {
		if (!contendId || !filename) {
			throw new Error('COULD_NOT_CREATE_PATH');
		}

		const path = `${this.getContentPath(contendId)}${filename}`;
		return path;
	}
}
