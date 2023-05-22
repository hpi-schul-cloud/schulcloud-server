/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Readable, Stream } from 'stream';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import upath from 'upath';
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

@Injectable()
export class ContentStorage implements IContentStorage {
	private deletedFolderName = 'trash';

	private maxFileLength: number;

	constructor(
		protected contentPath: string,
		protected options?: {
			invalidCharactersRegexp?: RegExp;
			maxPathLength?: number;
		}
	) {
		this.maxFileLength = (options?.maxPathLength ?? 255) - (contentPath.length + 1) - 23;

		if (this.maxFileLength < 20) {
			throw new Error(
				'The path of content directory is too long to add files to it. Put the directory into a different location.'
			);
		}
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

	// eslint-disable-next-line @typescript-eslint/require-await
	public async addFile(contentId: string, filename: string, stream: Stream, user?: IUser | undefined): Promise<void> {
		this.checkFilename(filename);
		if (!fs.existsSync(path.join(this.getContentPath(), contentId.toString()))) {
			throw new Error('404: storage-file-implementations:add-file-content-not-found');
		}

		const fullPath = path.join(this.getContentPath(), contentId.toString(), filename);
		const writeStream = fs.createWriteStream(fullPath);
		stream.pipe(writeStream);
	}

	public contentExists(contentId: string): Promise<boolean> {
		if (contentId === '' || contentId === undefined) {
			throw new Error('ContentId is empty or undefined.');
		}
		const exist = fs.existsSync(path.join(this.getContentPath(), contentId.toString()));
		const existPromise: Promise<boolean> = <Promise<boolean>>(<unknown>exist);
		return existPromise;
	}

	public async deleteContent(contentId: string, user?: IUser | undefined): Promise<void> {
		const fullPath = path.join(this.getContentPath(), contentId.toString());
		if (!fs.existsSync(fullPath)) {
			throw new Error('404: storage-file-implementations:delete-content-not-found');
		}
		try {
			fs.readdirSync(fullPath).forEach((file, index) => {
				const curPath = path.join(fullPath, file);
				fs.unlinkSync(curPath);
			});

			await fsPromises.rmdir(path.join(this.getContentPath(), contentId.toString()));
		} catch (error) {
			if (error) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				throw new Error(error.toString());
			}
		}
	}

	public async deleteFile(contentId: string, filename: string, user?: IUser | undefined): Promise<void> {
		this.checkFilename(filename);
		const absolutePath = path.join(this.getContentPath(), contentId.toString(), filename);
		const exist = fs.existsSync(absolutePath);
		if (!exist) {
			throw new Error('404: storage-file-implementations:delete-content-file-not-found');
		}
		await fsPromises.rm(absolutePath);
	}

	public fileExists(contentId: string, filename: string): Promise<boolean> {
		this.checkFilename(filename);
		if (contentId === '' || contentId === undefined) {
			throw new Error('ContentId is empty or undefined.');
		}
		const exist = fs.existsSync(path.join(this.getContentPath(), contentId.toString(), filename));
		const existPromise: Promise<boolean> = <Promise<boolean>>(<unknown>exist);
		return existPromise;
	}

	public async getFileStats(contentId: string, file: string, user: IUser): Promise<IFileStats> {
		if (!(await this.fileExists(contentId, file))) {
			throw new Error('404: content-file-missing');
		}
		const fileStats = await fsPromises.stat(path.join(this.getContentPath(), contentId.toString(), file));
		return fileStats;
	}

	public getFileStream(
		contentId: string,
		file: string,
		user: IUser,
		rangeStart?: number | undefined,
		rangeEnd?: number | undefined
	): Promise<Readable> {
		const exist = <boolean>(<unknown>this.fileExists(contentId, file));
		if (!exist) {
			throw new Error('404: content-file-missing');
		}
		return <Promise<Readable>>(<unknown>fs.createReadStream(
			path.join(this.getContentPath(), contentId.toString(), file),
			{
				start: rangeStart,
				end: rangeEnd,
			}
		));
	}

	public async getMetadata(contentId: string, user?: IUser | undefined): Promise<IContentMetadata> {
		if (user !== undefined && user !== null) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return JSON.parse(await streamToString(await this.getFileStream(contentId, 'h5p.json', user)));
		}
		throw new Error('Could not get Metadata');
	}

	public async getParameters(contentId: string, user?: IUser | undefined): Promise<any> {
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
			fs.mkdir(path.join(this.getContentPath(), contentId.toString()), { recursive: true }, (err) => {
				if (err) {
					throw new Error(err.toString());
				}
			});
		}
	}

	private hasDependencyOn(
		metadata: {
			dynamicDependencies?: ILibraryName[];
			editorDependencies?: ILibraryName[];
			preloadedDependencies?: ILibraryName[];
		},
		library: ILibraryName
	): boolean {
		if (
			metadata.preloadedDependencies?.some((dep) => LibraryName.equal(dep, library)) ||
			metadata.editorDependencies?.some((dep) => LibraryName.equal(dep, library)) ||
			metadata.dynamicDependencies?.some((dep) => LibraryName.equal(dep, library))
		) {
			return true;
		}
		return false;
	}

	private generalSanitizeFilename(filename: string, maxLength: number, invalidCharacterRegex: RegExp): string {
		let cleanedFilename = filename.replace(invalidCharacterRegex, '');

		let extension = upath.extname(cleanedFilename);
		let basename = upath.basename(cleanedFilename, extension);
		const dirname = upath.dirname(cleanedFilename);
		if (extension === '') {
			extension = basename;
			basename = 'file';
			cleanedFilename = `${dirname}/${basename}${extension}`;
		}

		const numberOfCharactersToCut = cleanedFilename.length - maxLength;
		if (numberOfCharactersToCut < 0) {
			return cleanedFilename;
		}

		const finalBasenameLength = Math.max(1, basename.length - numberOfCharactersToCut);
		return `${dirname}/${basename.substring(0, finalBasenameLength)}${extension}`;
	}

	checkFilename(filename: string): void {
		filename = filename.split('.').slice(0, -1).join('.');
		if (/^[a-zA-Z0-9/.-_]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new Error(`Filename contains forbidden characters ${filename}`);
	}
}
