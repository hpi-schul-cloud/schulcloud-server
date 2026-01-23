import { ErrorUtils } from '@core/error/utils';
import { CopyFiles, S3ClientAdapter } from '@infra/s3-client';
import {
	ContentId,
	IContentMetadata,
	IContentStorage,
	IFileStats,
	ILibraryName,
	IUser as ILumiUser,
} from '@lumieducation/h5p-server';
import {
	HttpException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
	NotImplementedException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { H5pFileDto } from '../controller/dto/h5p-file.dto';
import { H5PContent, H5PContentRepo } from '../repo';
import { H5PCountUsageResult, LumiUserWithContentData } from '../types';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN } from '../h5p-editor.const';

@Injectable()
export class ContentStorage implements IContentStorage {
	constructor(
		private readonly repo: H5PContentRepo,
		@Inject(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN) private readonly storageClient: S3ClientAdapter
	) {}

	private async createOrUpdateContent(
		contentId: ContentId,
		user: LumiUserWithContentData,
		metadata: IContentMetadata,
		content: unknown
	): Promise<H5PContent> {
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
		return h5pContent;
	}

	public async addContent(
		metadata: IContentMetadata,
		content: unknown,
		user: LumiUserWithContentData,
		contentId?: ContentId | undefined
	): Promise<ContentId> {
		try {
			const h5pContent = await this.createOrUpdateContent(contentId as string, user, metadata, content);
			await this.repo.save(h5pContent);

			return h5pContent.id;
		} catch (error) {
			throw new HttpException('message', 500, {
				cause: new InternalServerErrorException(error as string, 'ContentStorage:addContent'),
			});
		}
	}

	public async addFile(contentId: string, filename: string, stream: Readable): Promise<void> {
		this.checkFilename(filename);

		const contentExists = await this.contentExists(contentId);
		if (!contentExists) {
			throw new NotFoundException('The content does not exist');
		}

		const fullPath = this.getFilePath(contentId, filename);
		const file: H5pFileDto = {
			name: filename,
			data: stream,
			mimeType: 'application/octet-stream',
		};

		await this.storageClient.create(fullPath, file);
	}

	public async contentExists(contentId: string): Promise<boolean> {
		const exists = await this.repo.existsOne(contentId);

		return exists;
	}

	public async deleteContent(contentId: string): Promise<void> {
		try {
			const h5pContent = await this.repo.findById(contentId);

			const fileList = await this.listFiles(contentId);
			const fileDeletePromises = fileList.map((file) => this.deleteFile(contentId, file));

			await Promise.all([this.repo.delete(h5pContent), ...fileDeletePromises]);
		} catch (error) {
			throw new HttpException('message', 500, {
				cause: new InternalServerErrorException(error as string, 'ContentStorage:addContent'),
			});
		}
	}

	public async deleteFile(contentId: string, filename: string): Promise<void> {
		this.checkFilename(filename);
		const filePath = this.getFilePath(contentId, filename);
		await this.storageClient.delete([filePath]);
	}

	public fileExists(contentId: string, filename: string): Promise<boolean> {
		this.checkFilename(filename);

		const filePath = this.getFilePath(contentId, filename);

		return this.exists(filePath);
	}

	public async getFileStats(contentId: string, file: string): Promise<IFileStats> {
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
		_user: ILumiUser,
		rangeStart = 0,
		rangeEnd?: number
	): Promise<Readable> {
		const filePath = this.getFilePath(contentId, file);

		let range: string | undefined;
		if (rangeStart && rangeEnd) {
			// Closed range
			range = `bytes=${rangeStart}-${rangeEnd}`;
		}

		const { data } = await this.storageClient.get(filePath, range);

		return data;
	}

	public async getMetadata(contentId: string): Promise<IContentMetadata> {
		const h5pContent = await this.repo.findById(contentId);
		return h5pContent.metadata;
	}

	public async getParameters(contentId: string): Promise<unknown> {
		const h5pContent = await this.repo.findById(contentId);
		return h5pContent.content;
	}

	/**
	 * Calculates how often a library is in use.
	 * @param library the library for which to calculate usage.
	 * @returns asDependency: how often the library is used as subcontent in
	 * content; asMainLibrary: how often the library is used as a main library
	 */
	public async getUsage(library: ILibraryName): Promise<H5PCountUsageResult> {
		const { asMainLibrary, asDependency } = await this.repo.countUsage(library);

		return { asMainLibrary, asDependency };
	}

	public listContent(): Promise<string[]> {
		throw new NotImplementedException('Method not implemented.');
	}

	public async listFiles(contentId: string): Promise<string[]> {
		const contentExists = await this.contentExists(contentId);
		if (!contentExists) {
			throw new HttpException('message', 404, {
				cause: new NotFoundException('Content could not be found'),
			});
		}

		const path = this.getContentPath(contentId);
		const { files } = await this.storageClient.list({ path });

		return files;
	}

	public async copyAllFiles(sourceContentId: string, targetContentId: string): Promise<void> {
		const filenames = await this.listFiles(sourceContentId);

		const copyFiles: CopyFiles[] = filenames.map((filename: string) => {
			const copy: CopyFiles = {
				sourcePath: this.getFilePath(sourceContentId, filename),
				targetPath: this.getFilePath(targetContentId, filename),
			};

			return copy;
		});

		await this.storageClient.copy(copyFiles);
	}

	private async exists(checkPath: string): Promise<boolean> {
		try {
			await this.storageClient.get(checkPath);
		} catch (err) {
			if (err instanceof NotFoundException) {
				return false;
			}

			throw new InternalServerErrorException(
				null,
				ErrorUtils.createHttpExceptionOptions(err, 'ContentStorage:addContent')
			);
		}

		return true;
	}

	private checkFilename(filename: string): void {
		filename = filename.split('.').slice(0, -1).join('.');
		if (/^[a-zA-Z0-9/._-]*$/.test(filename) && !filename.includes('..') && !filename.startsWith('/')) {
			return;
		}
		throw new HttpException('message', 406, {
			cause: new NotAcceptableException(`Filename contains forbidden characters ${filename}`),
		});
	}

	private getContentPath(contentId: string): string {
		if (!contentId) {
			throw new HttpException('message', 406, {
				cause: new UnprocessableEntityException('COULD_NOT_CREATE_PATH'),
			});
		}

		const path = `h5p-content/${contentId}/`;
		return path;
	}

	private getFilePath(contentId: string, filename: string): string {
		if (!contentId || !filename) {
			throw new HttpException('message', 406, {
				cause: new UnprocessableEntityException('COULD_NOT_CREATE_PATH'),
			});
		}

		const path = `${this.getContentPath(contentId)}${filename}`;
		return path;
	}
}
