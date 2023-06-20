/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { Readable, Stream, pipeline } from 'stream';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import { getAllFiles } from 'get-all-files';
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

@Injectable()
export class ContentStorage implements IContentStorage {
	constructor(private readonly storageClient: S3ClientAdapter) {}

	public async addContent(
		metadata: IContentMetadata,
		content: unknown,
		user: IUser,
		contentId?: ContentId | undefined
	): Promise<ContentId> {
		if (contentId === null || contentId === undefined) {
			contentId = await this.createContentId();
		}
		const h5pPath = path.join(this.getContentPath(), contentId.toString(), 'h5p.json');
		const contentPath = path.join(this.getContentPath(), contentId.toString(), 'content.json');
		const h5pExists = await this.exists(h5pPath);
		const contentExists = await this.exists(contentPath);
		if (h5pExists || contentExists) {
			throw new Error(`Error creating content. Content already exists`);
		}
		try {
			const readableStreamMetadata = new Stream.Readable({ objectMode: true });
			readableStreamMetadata._read = function test() {};
			readableStreamMetadata.push(JSON.stringify(metadata));
			const h5pFile: FileDto = {
				name: 'h5p.json',
				data: readableStreamMetadata,
				mimeType: 'json',
			};
			await this.storageClient.create(h5pPath, h5pFile);

			const readableStreamContent = new Stream.Readable({ objectMode: true });
			readableStreamContent._read = function test() {};
			readableStreamContent.push(JSON.stringify(content));
			const contentFile: FileDto = {
				name: 'content.json',
				data: readableStreamContent,
				mimeType: 'json',
			};
			await this.storageClient.create(contentPath, contentFile);
		} catch (error) {
			const h5pExistsAlready = await this.exists(h5pPath);
			if (h5pExistsAlready) {
				await this.storageClient.delete([h5pPath]);
			}
			const contentExistsAlready = await this.exists(contentPath);
			if (contentExistsAlready) {
				await this.storageClient.delete([contentPath]);
			}

			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			throw new Error(`Error creating content.${error.toString()}`);
		}
		const contentIdList = await this.getContentIdList();
		if (contentIdList.length === 0) {
			await this.createOrUpdateContentIdList([contentId], true);
		} else {
			contentIdList.push(contentId);
			await this.createOrUpdateContentIdList(contentIdList, false);
		}
		return contentId;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
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
		const fileList = await this.getFileList(contentId);
		if (fileList.length === 0) {
			await this.createOrUpdateFileList(contentId, [filename], true);
		} else {
			fileList.push(filename);
			await this.createOrUpdateFileList(contentId, fileList, false);
		}
	}

	public contentExists(contentId: string): Promise<boolean> {
		if (contentId === '' || contentId === undefined) {
			throw new Error('ContentId is empty or undefined.');
		}
		const exist = this.exists(path.join(this.getContentPath(), contentId.toString()));
		return exist;
	}

	public async deleteContent(contentId: string, user?: IUser | undefined): Promise<void> {
		try {
			const contentPath = path.join(this.getContentPath(), contentId.toString());
			const contentExists = await this.exists(contentPath);
			if (!contentExists) {
				throw new Error('404: Content not Found at deleteContent.');
			}
			const fileList = await this.getFileList(contentId);
			if (fileList.length > 0) {
				fileList.forEach((file) => {
					void this.deleteFile(contentId, file);
				});
			}
			const existH5p = await this.exists(path.join(contentPath, 'h5p.json'));
			if (existH5p) {
				await this.deleteFile(contentId, 'h5p.json');
			}
			const existContent = await this.exists(path.join(contentPath, 'content.json'));
			if (existContent) {
				await this.deleteFile(contentId, 'content.json');
			}
			const existList = await this.exists(path.join(contentPath, 'contentfilelist.json'));
			if (existList) {
				await this.deleteFile(contentId, 'contentfilelist.json');
			}
		} catch (error) {
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				throw new Error(error.toString());
			}
		}
		const contentIdList = await this.getContentIdList();
		if (contentIdList.length === 1) {
			await this.deleteFile('contentidlist', 'contentidlist.json');
		} else {
			const index = contentIdList.indexOf(contentId);
			contentIdList.splice(index, 1);
			await this.createOrUpdateContentIdList(contentIdList, false);
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
		const fileList = await this.getFileList(contentId);
		if (fileList.length === 1) {
			await this.deleteFile(contentId, 'contentfilelist.json');
		} else if (fileList.length > 1) {
			const index = fileList.indexOf(filename);
			fileList.splice(index, 1);
			await this.createOrUpdateContentIdList(fileList, false);
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
		if (fileSize) {
			// TODO: birthtime
			const date = new Date('01.01.01');
			const fileStats2: IFileStats = {
				birthtime: date,
				size: fileSize,
			};
			return <Promise<IFileStats>>(<unknown>fileStats2);
		}
		throw new Error('Missing File Stats!');
	}

	public async getFileStream(
		contentId: string,
		file: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		const exist = <boolean>(<unknown>this.fileExists(contentId, file));
		if (!exist) {
			throw new Error('404: Content file missing.');
		}
		const filePath = path.join(this.getContentPath(), contentId.toString(), file);
		// TODO: add bytesRange
		const fileResponse = this.storageClient.get(filePath);
		const streamFile = new StreamableFile((await fileResponse).data, {
			type: (await fileResponse).contentType,
			disposition: `inline; filename="${encodeURI(contentId)}"`,
			length: (await fileResponse).contentLength,
		});
		const stream = (await fileResponse).data;
		return streamFile.getStream();
	}

	public async getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		if (user !== undefined && user !== null) {
			const fileStream = await this.getFileStream(contentId, 'h5p.json', user);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this.getJsonData(fileStream);
		}
		throw new Error('Could not get Metadata');
	}

	public async getParameters(contentId: string, user?: IUser | undefined): Promise<unknown> {
		if (user !== undefined && user !== null) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			const fileStream = await this.getFileStream(contentId, 'content.json', user);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this.getJsonData(fileStream);
		}
		throw new Error('Could not get Parameters');
	}

	public async getUsage(library: ILibraryName): Promise<{ asDependency: number; asMainLibrary: number }> {
		let asDependency = 0;
		let asMainLibrary = 0;
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
		for (const contentId of contentIds) {
			// eslint-disable-next-line no-await-in-loop
			const contentMetadata = await this.getMetadata(contentId, defaultUser);
			const isMainLibrary = contentMetadata.mainLibrary === library.machineName;
			if (this.hasDependencyOn(contentMetadata, library)) {
				if (isMainLibrary) {
					asMainLibrary += 1;
				} else {
					asDependency += 1;
				}
			}
		}
		return { asDependency, asMainLibrary };
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getUserPermissions(contentId: string, user: IUser): Promise<Permission[]> {
		const permission = <Promise<Permission[]>>(
			(<unknown>[Permission.Delete, Permission.Download, Permission.Edit, Permission.Embed, Permission.View])
		);
		return permission;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async listContent(user?: IUser | undefined): Promise<string[]> {
		return this.getContentIdList();
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async listFiles(contentId: string, user: IUser): Promise<string[]> {
		const fileList = this.getFileList(contentId);
		return fileList;
	}

	// private methods

	protected async createContentId() {
		let counter = 0;
		let id = 0;
		let exist = true;
		do {
			id = ContentStorage.getRandomId(1, 2 ** 32);
			counter += 1;
			const p = path.join(this.getContentPath(), id.toString());
			try {
				// eslint-disable-next-line no-await-in-loop
				await fsPromises.access(p);
			} catch (error) {
				exist = false;
			}
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
			await this.storageClient.get(checkPath);
			return true;
		} catch (error) {
			if (error instanceof NotFoundException) {
				return false;
			}
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				throw new Error(error.toString());
			}
		}
		return false;
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

	private checkFilename(filename: string): void {
		filename = filename.split('.').slice(0, -1).join('.');
		if (/^[a-zA-Z0-9/._-]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters ${filename}`);
	}

	private async getContentIdList(): Promise<string[]> {
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			const fileStream = await this.getFileStream('contentidlist', 'contentidlist.json', user);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const contentIdList: string[] = this.getJsonData(fileStream);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return contentIdList;
		} catch (error) {
			return [];
		}
	}

	private async createOrUpdateContentIdList(contentIdListArray: string[], create: boolean) {
		if (!create) {
			await this.deleteFile('contentidlist', 'contentidlist.json');
		}
		const contentIdListPath = path.join(this.getContentPath(), 'contentidlist.json');
		const contentIdList = {
			contentIdList: [contentIdListArray],
		};
		const readableStream = new Stream.Readable({ objectMode: true });
		readableStream._read = function test() {};
		readableStream.push(JSON.stringify(contentIdList));
		const contentIdListFile: FileDto = {
			name: 'contentidlist.json',
			data: readableStream,
			mimeType: 'json',
		};
		await this.storageClient.create(contentIdListPath, contentIdListFile);
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			const fileStream = await this.getFileStream(contentId, 'contentfilelist.json', user);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const contentIdList: string[] = this.getJsonData(fileStream);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return contentIdList;
		} catch (error) {
			return [];
		}
	}

	private async createOrUpdateFileList(contentId: string, fileListArray: string[], create: boolean) {
		if (!create) {
			await this.deleteFile(contentId, 'contentfilelist.json');
		}
		const fileListPath = path.join(this.getContentPath(), 'contentfilelist.json');
		const fileList = {
			contentIdList: [fileListArray],
		};
		const readableStream = new Stream.Readable({ objectMode: true });
		readableStream._read = function test() {};
		readableStream.push(JSON.stringify(fileList));
		const fileListFile: FileDto = {
			name: 'contentfilelist.json',
			data: readableStream,
			mimeType: 'json',
		};
		await this.storageClient.create(fileListPath, fileListFile);
	}

	private getJsonData(fileStream: Readable) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const fileJson: JSON = JSON.parse(JSON.stringify(fileStream));
		// eslint-disable-next-line prefer-destructuring, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const data = fileJson['_readableState']['buffer']['head']['data'];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
		return JSON.parse(data);
	}
}
