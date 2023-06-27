/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import {
	ContentId,
	IContentMetadata,
	IContentStorage,
	LibraryName,
	IFileStats,
	ILibraryName,
	IUser,
	Permission,
	streamToString,
} from '@lumieducation/h5p-server';
import path from 'path';
import { FileDto } from '@src/modules/files-storage/dto';
import { S3ClientAdapter } from '../../files-storage/client/s3-client.adapter';
import { ContentMetadataRepo } from './contentMetadata.repo';
import { ContentMetadata } from './contentMetadata.entity';

@Injectable()
export class ContentStorage implements IContentStorage {
	constructor(private readonly repo: ContentMetadataRepo, private readonly storageClient: S3ClientAdapter) {}

	public async addContent(
		metadata: IContentMetadata,
		content: unknown,
		user: IUser,
		contentId?: ContentId | undefined
	): Promise<ContentId> {
		if (contentId === null || contentId === undefined) {
			contentId = await this.createContentId();
		}
		const contentPath = path.join(this.getContentPath(), contentId.toString(), 'content.json');
		try {
			if (!metadata.defaultLanguage) {
				metadata.defaultLanguage = metadata.language;
			}
			const contentMetadata = new ContentMetadata(contentId, metadata);
			await this.repo.createContentMetadata(contentMetadata);

			const readableContent = Readable.from(JSON.stringify(content));
			const contentFile: FileDto = {
				name: 'content.json',
				data: readableContent,
				mimeType: 'json',
			};
			await this.storageClient.create(contentPath, contentFile);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			throw new Error(`Error creating content.${error.toString()}`);
		}
		return contentId;
	}

	public async addFile(contentId: string, filename: string, stream: Stream, user?: IUser | undefined): Promise<void> {
		this.checkFilename(filename);

		const contentPath = path.join(this.getContentPath(), contentId.toString());
		const contentExists = await this.exists(contentPath);
		if (!contentExists) {
			throw new Error('404: Content not Found at addFile.');
		}
		const fullPath = path.join(this.getContentPath(), contentId.toString(), filename);
		const file: FileDto = {
			name: filename,
			data: stream as Readable,
			mimeType: 'json',
		};
		await this.storageClient.create(fullPath, file);
		await this.updateFileList(contentId, filename, 'add');
	}

	public async contentExists(contentId: string): Promise<boolean> {
		if (contentId === '' || contentId === undefined) {
			throw new Error('ContentId is empty or undefined.');
		}
		const exist = await this.exists(path.join(this.getContentPath(), contentId.toString(), 'content.json'));
		if (!exist) {
			return false;
		}
		try {
			const file = await this.repo.findById(contentId);
		} catch (error) {
			if (error) {
				return false;
			}
		}
		return true;
	}

	public async deleteContent(contentId: string, user?: IUser | undefined): Promise<void> {
		try {
			const fileList = await this.getFileList(contentId);
			if (fileList.length > 0) {
				const deletePromise = fileList.map((file) => this.deleteFile(contentId, file));
				await Promise.allSettled(deletePromise);
			}
			const contentMetadata = await this.repo.findById(contentId);
			await Promise.allSettled([
				this.deleteFile(contentId, 'content.json'),
				this.repo.delete(contentMetadata),
				this.deleteFile(contentId, 'contentfilelist.json'),
			]);
		} catch (error) {
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions
				throw new Error(`Error deleting content.${error.toString()}`);
			}
		}
	}

	public async deleteFile(contentId: string, filename: string, user?: IUser | undefined): Promise<void> {
		this.checkFilename(filename);
		const filePath = path.join(this.getContentPath(), contentId.toString(), filename);
		const fileExists = await this.exists(filePath);
		if (!fileExists) {
			throw new Error('404: Content not Found at deleteFile.');
		}
		await this.storageClient.delete([filePath]);
		if (filename !== 'contentfilelist.json' && filename !== 'content.json' && filename !== 'h5p.json') {
			await this.updateFileList(contentId, filename, 'delete');
		}
	}

	public fileExists(contentId: string, filename: string): Promise<boolean> {
		this.checkFilename(filename);
		if (contentId === '' || contentId === undefined) {
			throw new Error('ContentId is empty or undefined.');
		}
		const exist = this.exists(path.join(this.getContentPath(), contentId.toString(), filename));
		return exist;
	}

	public async getFileStats(contentId: string, file: string, user: IUser): Promise<IFileStats> {
		if (!(await this.fileExists(contentId, file))) {
			throw new Error('404: Content does not found to get file stats.');
		}
		const filePath = path.join(this.getContentPath(), contentId.toString(), file);
		const fileResponse = this.storageClient.get(filePath);
		const fileSize = (await fileResponse).contentLength;
		// TODO: birthtime
		const date = new Date('01.01.01');
		const fileStats: IFileStats = {
			birthtime: date,
			size: 0,
		};
		if (fileSize) {
			fileStats.size = fileSize;
		}
		return <Promise<IFileStats>>(<unknown>fileStats);
	}

	public async getFileStream(
		contentId: string,
		file: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		const filePath = path.join(this.getContentPath(), contentId, file);
		const exist = await this.exists(filePath);
		if (!exist) {
			throw new Error('404: Content file missing.');
		}
		// TODO: add bytesRange
		const fileResponse = await this.storageClient.get(filePath);
		return fileResponse.data;
	}

	public async getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		if (user !== undefined && user !== null) {
			const contentMetadata = await this.repo.findById(contentId);
			const metadata: IContentMetadata = contentMetadata;
			return metadata;
		}
		throw new Error('Could not get Metadata');
	}

	public async getParameters(contentId: string, user?: IUser | undefined): Promise<unknown> {
		if (user !== undefined && user !== null) {
			const fileStream = await this.getFileStream(contentId, 'content.json', user);
			const jsonData = await this.getJsonData(fileStream);
			return jsonData;
		}
		throw new Error('Could not get Parameters');
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
		const permission = <Promise<Permission[]>>(
			(<unknown>[Permission.Delete, Permission.Download, Permission.Edit, Permission.Embed, Permission.View])
		);
		return permission;
	}

	public async listContent(user?: IUser | undefined): Promise<string[]> {
		const contentMetadataList = await this.repo.getAllMetadata();
		const contentList: string[] = [];
		contentMetadataList.forEach((contentMetadata) => {
			contentList.push(contentMetadata.contentId);
		});
		return contentList;
	}

	public async listFiles(contentId: string, user: IUser): Promise<string[]> {
		const fileList = this.getFileList(contentId);
		return fileList;
	}

	protected async createContentId() {
		let counter = 0;
		let id = 0;
		let exist = true;
		do {
			id = ContentStorage.getRandomId(1, 2 ** 32);
			counter += 1;
			// eslint-disable-next-line no-await-in-loop
			exist = await this.contentExists(id.toString());
		} while (exist && counter < 10);
		if (exist && counter === 10) {
			throw new Error('Error generating contentId.');
		}
		return id.toString();
	}

	private static getRandomId(min: number, max: number): number {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, @typescript-eslint/no-var-requires
		const crypto = require('crypto');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		return crypto.randomBytes(4).readUInt32BE(0, true);
	}

	protected getContentPath(): string {
		return '/h5p/';
	}

	private async exists(checkPath: string): Promise<boolean> {
		try {
			const file = await this.storageClient.get(checkPath);
		} catch (error) {
			if (error instanceof NotFoundException) {
				return false;
			}
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				throw new Error(error.toString());
			}
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
		for (const contentId of contentIds) {
			// eslint-disable-next-line no-await-in-loop
			const contentMetadata = await this.getMetadata(contentId, user);
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
		if (
			/^[a-zA-Z0-9/._-]*$/.test(filename) &&
			!filename.includes('..') &&
			!filename.startsWith('/') &&
			!(filename === 'content.json') &&
			!(filename === 'h5p.json') &&
			!(filename === 'contentfilelist.json')
		) {
			return;
		}
		throw new Error(`Filename contains forbidden characters ${filename}`);
	}

	private async getFileList(contentId: string) {
		try {
			const user: IUser = {
				canCreateRestricted: false,
				canInstallRecommended: false,
				canUpdateAndInstallLibraries: false,
				email: '',
				id: '',
				name: '',
				type: '',
			};
			const fileStream = await this.getFileStream(contentId, 'contentfilelist.json', user);
			const contentIdList: string[] = (await this.getJsonData(fileStream)) as string[];
			return contentIdList;
		} catch (error) {
			return [];
		}
	}

	async updateFileList(contentId: string, filename: string, operation: string) {
		const fileListArray = await this.getFileList(contentId);
		let newFileList: string[] = [];
		if (operation === 'add') {
			if (fileListArray.length === 0) {
				newFileList.push(contentId);
			} else {
				fileListArray.push(contentId);
				newFileList = fileListArray;
				await this.deleteFile(contentId, 'contentfilelist.json');
			}
		} else if (operation === 'delete') {
			if (fileListArray.length === 1) {
				await this.deleteFile(contentId, 'contentfilelist.json');
				return;
			}
			const index = fileListArray.indexOf(filename);
			fileListArray.splice(index, 1);
			newFileList = fileListArray;
		}

		const fileListPath = path.join(this.getContentPath(), 'contentfilelist.json');
		const fileList = {
			contentIdList: [newFileList],
		};
		const readable = Readable.from(fileList.toString());
		const fileListFile: FileDto = {
			name: 'contentfilelist.json',
			data: readable,
			mimeType: 'json',
		};
		await this.storageClient.create(fileListPath, fileListFile);
	}

	private async getJsonData(fileStream: Readable): Promise<unknown> {
		const body = await streamToString(fileStream);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return JSON.parse(body);
	}
}
