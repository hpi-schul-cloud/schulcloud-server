/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ContentId,
	IContentMetadata,
	IContentStorage,
	IFileStats,
	ILibraryName,
	IUser as ILumiUser,
	LibraryName,
	Permission,
} from '@lumieducation/h5p-server';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { FileDto } from '@src/modules/files-storage/dto';
import { Readable } from 'stream';
import { H5PContent } from '../entity';
import { H5P_CONTENT_S3_CONNECTION } from '../h5p-editor.config';
import { H5PContentRepo } from '../repo';
import { LumiUserWithContentData } from '../types/lumi-types';

@Injectable()
export class ContentStorage implements IContentStorage {
	constructor(
		private readonly repo: H5PContentRepo,
		@Inject(H5P_CONTENT_S3_CONNECTION) private readonly storageClient: S3ClientAdapter
	) {}

	private checkExtendedUserType(user: ILumiUser) {
		const isExtendedUserType = user instanceof LumiUserWithContentData;

		if (!isExtendedUserType) {
			throw new Error('Method expected LumiUserWithContentData instead of IUser');
		}
	}

	public async addContent(
		metadata: IContentMetadata,
		content: unknown,
		user: LumiUserWithContentData,
		contentId?: ContentId | undefined
	): Promise<ContentId> {
		try {
			this.checkExtendedUserType(user);

			let h5pContent: H5PContent;

			if (contentId) {
				h5pContent = await this.repo.findById(contentId);
				h5pContent.metadata = metadata;
				h5pContent.content = content;
			} else {
				h5pContent = new H5PContent({
					parentType: user.contentParentType,
					parentId: user.contentParentId,
					creatorId: user.id,
					schoolId: user.schoolId,
					metadata,
					content,
				});
			}

			await this.repo.save(h5pContent);

			return h5pContent.id;
		} catch (error) {
			throw new InternalServerErrorException(error, 'ContentStorage:addContent');
		}
	}

	public async addFile(contentId: string, filename: string, stream: Readable, user?: ILumiUser): Promise<void> {
		this.checkFilename(filename);

		const contentExists = await this.contentExists(contentId);
		if (contentExists) {
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
		const exists = await this.repo.existsOne(contentId);

		return exists;
	}

	public async deleteContent(contentId: string, user?: ILumiUser): Promise<void> {
		try {
			const h5pContent = await this.repo.findById(contentId);

			const fileList = await this.listFiles(contentId, user);
			const fileDeletePromises = fileList.map((file) => this.deleteFile(contentId, file));

			await Promise.all([this.repo.delete(h5pContent), ...fileDeletePromises]);
		} catch (error) {
			throw new InternalServerErrorException(error, 'ContentStorage:deleteContent');
		}
	}

	public async deleteFile(contentId: string, filename: string, user?: ILumiUser | undefined): Promise<void> {
		this.checkFilename(filename);
		const filePath = this.getFilePath(contentId, filename);
		await this.storageClient.delete([filePath]);
	}

	public async fileExists(contentId: string, filename: string): Promise<boolean> {
		this.checkFilename(filename);

		const filePath = this.getFilePath(contentId, filename);

		return this.exists(filePath);
	}

	public async getFileStats(contentId: string, file: string, user: ILumiUser): Promise<IFileStats> {
		const filePath = this.getFilePath(contentId, file);
		const { ContentLength, LastModified } = await this.storageClient.head(filePath);

		if (ContentLength === undefined || LastModified === undefined) {
			throw new InternalServerErrorException(
				{ ContentLength, LastModified },
				'ContentStorage:getFileStats ContentLength or LastModified are undefined'
			);
		}

		const fileStats: IFileStats = {
			birthtime: LastModified,
			size: ContentLength,
		};

		return fileStats;
	}

	public async getFileStream(
		contentId: string,
		file: string,
		user: ILumiUser,
		rangeStart = 0,
		rangeEnd?: number
	): Promise<Readable> {
		const filePath = this.getFilePath(contentId, file);

		let range: string;
		if (rangeEnd === undefined) {
			// Open ended range
			range = `${rangeStart}-`;
		} else {
			// Closed range
			range = `${rangeStart}-${rangeEnd}`;
		}

		const fileResponse = await this.storageClient.get(filePath, range);
		return fileResponse.data;
	}

	public async getMetadata(contentId: string, user?: ILumiUser | undefined): Promise<IContentMetadata> {
		const h5pContent = await this.repo.findById(contentId);
		return h5pContent.metadata;
	}

	public async getParameters(contentId: string, user?: ILumiUser | undefined): Promise<unknown> {
		const h5pContent = await this.repo.findById(contentId);
		return h5pContent.content;
	}

	public async getUsage(library: ILibraryName): Promise<{ asDependency: number; asMainLibrary: number }> {
		const defaultUser: ILumiUser = {
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

	public getUserPermissions(contentId: string, user: ILumiUser): Promise<Permission[]> {
		const permissions = [Permission.Delete, Permission.Download, Permission.Edit, Permission.Embed, Permission.View];

		return Promise.resolve(permissions);
	}

	public async listContent(user?: ILumiUser): Promise<string[]> {
		const contentList = await this.repo.getAllContents();

		const contentIDs = contentList.map((c) => c.id);
		return contentIDs;
	}

	public async listFiles(contentId: string, user?: ILumiUser): Promise<string[]> {
		const contentExists = await this.contentExists(contentId);
		if (contentExists) {
			throw new NotFoundException('Content could not be found');
		}

		const path = this.getContentPath(contentId);
		const { files } = await this.storageClient.list({ path });

		return files;
	}

	private async exists(checkPath: string): Promise<boolean> {
		try {
			await this.storageClient.head(checkPath);
		} catch (err) {
			if (err instanceof NotFoundException) {
				return false;
			}

			throw new InternalServerErrorException(err, 'ContentStorage:exists');
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

	private async resolveDependecies(contentIds: string[], user: ILumiUser, library: ILibraryName) {
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

	private getContentPath(contentId: string): string {
		if (!contentId) {
			throw new Error('COULD_NOT_CREATE_PATH');
		}

		const path = `h5p-content/${contentId}/`;
		return path;
	}

	private getFilePath(contentId: string, filename: string): string {
		if (!contentId || !filename) {
			throw new Error('COULD_NOT_CREATE_PATH');
		}

		const path = `${this.getContentPath(contentId)}${filename}`;
		return path;
	}
}
