/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Readable, Stream } from 'stream';
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
	constructor(
		private readonly storageClient: S3ClientAdapter,
		protected contentPath?: string,
		protected options?: {
			invalidCharactersRegexp?: RegExp;
			maxPathLength?: number;
		}
	) {}

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
			const h5pFile: FileDto = {
				name: 'h5p.json',
				data: Readable.from(JSON.stringify(metadata)),
				mimeType: 'json',
			};
			await this.storageClient.create(h5pPath, h5pFile);

			const contentFile: FileDto = {
				name: 'content.json',
				data: content as Readable,
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
	}

	public contentExists(contentId: string): Promise<boolean> {
		if (contentId === '' || contentId === undefined) {
			throw new Error('ContentId is empty or undefined.');
		}
		const exist = this.exists(path.join(this.getContentPath(), contentId.toString()));
		return exist;
	}

	public async deleteContent(contentId: string, user?: IUser | undefined): Promise<void> {
		const fullPath = path.join(this.getContentPath(), contentId.toString());
		try {
			const contentPath = path.join(this.getContentPath(), contentId.toString());
			const contentExists = await this.exists(contentPath);
			if (!contentExists) {
				throw new Error('404: Content not Found at deleteContent.');
			}
			await this.storageClient.delete([contentPath]);
		} catch (error) {
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				throw new Error(error.toString());
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
			const fileStats2: IFileStats = {
				birthtime: undefined,
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
		const stream = (await fileResponse).data;
		return stream;
	}

	public async getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		if (user !== undefined && user !== null) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return JSON.parse(await streamToString(await this.getFileStream(contentId, 'h5p.json', user)));
		}
		throw new Error('Could not get Metadata');
	}

	public async getParameters(contentId: string, user?: IUser | undefined): Promise<unknown> {
		if (user !== undefined && user !== null) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return JSON.parse(await streamToString(await this.getFileStream(contentId, 'content.json', user)));
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

	public async listContent(user?: IUser | undefined): Promise<string[]> {
		const directories = await fsPromises.readdir(this.getContentPath());
		return (
			await Promise.all(
				directories.map(async (dir) => {
					if (
						!(await (<Promise<string[]>>(<unknown>fs.existsSync(path.join(this.getContentPath(), dir, 'h5p.json')))))
					) {
						return '';
					}
					return dir;
				})
			)
		).filter((content) => content !== '');
	}

	public async listFiles(contentId: string, user: IUser): Promise<string[]> {
		const contentDirectoryPath = path.join(this.getContentPath(), contentId.toString());
		const contentDirectoryPathLength = contentDirectoryPath.length + 1;
		const absolutePaths = await getAllFiles(path.join(contentDirectoryPath)).toArray();
		const contentPath = path.join(contentDirectoryPath, 'content.json');
		const h5pPath = path.join(contentDirectoryPath, 'h5p.json');
		return absolutePaths
			.filter((p) => p !== contentPath && p !== h5pPath)
			.map((p) => p.substring(contentDirectoryPathLength));
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
		if (this.contentPath !== undefined) {
			return this.contentPath;
		}
		return '';
	}

	private async existsOrCreateDir(contentId: ContentId, subdir = '') {
		await fsPromises.mkdir(path.join(this.getContentPath(), contentId.toString(), subdir), { recursive: true });
	}

	private async exists(path1: string): Promise<boolean> {
		try {
			await this.storageClient.get(path1);
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

	checkFilename(filename: string): void {
		filename = filename.split('.').slice(0, -1).join('.');
		if (/^[a-zA-Z0-9/._-]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters ${filename}`);
	}
}
