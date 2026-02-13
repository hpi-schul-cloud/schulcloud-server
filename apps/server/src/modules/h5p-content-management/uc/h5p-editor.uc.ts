import { Logger } from '@core/logger';
import { ICurrentUser } from '@infra/auth-guard';
import {
	AuthorizationBodyParamsReferenceType,
	AuthorizationClientAdapter,
	AuthorizationContextBuilder,
	AuthorizationContextParams,
} from '@infra/authorization-client';
import {
	AjaxSuccessResponse,
	H5PAjaxEndpoint,
	H5PEditor,
	H5PPlayer,
	IContentMetadata,
	IEditorModel,
	IPlayerModel,
	IUser as LumiIUser,
} from '@lumieducation/h5p-server';
import {
	ContentParameters,
	IAjaxResponse,
	IHubInfo,
	ILibraryDetailedDataForClient,
	ILibraryOverviewForClient,
} from '@lumieducation/h5p-server/build/src/types';
import { UserService } from '@modules/user';
import {
	BadRequestException,
	HttpException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { mkdtempSync, rmSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { AjaxGetQueryParams, AjaxPostBodyParams, AjaxPostQueryParams, H5PContentResponse } from '../controller/dto';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from '../h5p-editor.config';
import { getLibraryWhiteList } from '../helper';
import { H5PUcErrorLoggable, H5PUcLoggable } from '../loggable';
import { H5PContentMapper } from '../mapper/h5p-content.mapper';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { H5PContentParentType, H5PUploadFile, LumiUserWithContentData } from '../types';
import { GetLibraryFile } from './dto/h5p-getLibraryFile';

// As a workaround, we have to assign all files the type “unknown.type” as “tempFilePath,” otherwise the H5P library throws errors.
// See: https://github.com/Lumieducation/H5P-Nodejs-library/blob/fb84581b3aa68cfd521e84b6438c0c177d34a4be/packages/h5p-server/src/H5PEditor.ts#L659
const UNKNOWN_TYPE = 'unknown.type';

@Injectable()
export class H5PEditorUc {
	constructor(
		@Inject(H5P_EDITOR_CONFIG_TOKEN) private readonly config: H5PEditorConfig,
		private readonly h5pEditor: H5PEditor,
		private readonly h5pPlayer: H5PPlayer,
		private readonly h5pAjaxEndpoint: H5PAjaxEndpoint,
		private readonly libraryService: LibraryStorage,
		private readonly userService: UserService,
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly h5pContentRepo: H5PContentRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(H5PEditorUc.name);
	}

	private async checkContentPermission(
		parentType: H5PContentParentType,
		parentId: EntityId,
		context: AuthorizationContextParams
	): Promise<void> {
		const allowedType: AuthorizationBodyParamsReferenceType =
			H5PContentMapper.mapToAllowedAuthorizationEntityType(parentType);

		await this.authorizationClientAdapter.checkPermissionsByReference(allowedType, parentId, context);
	}

	private async checkUserIsAuthenticatedAndEnrolled(currentUser: ICurrentUser): Promise<void> {
		await this.authorizationClientAdapter.checkPermissionsByReference(
			AuthorizationBodyParamsReferenceType.SCHOOLS,
			currentUser.schoolId,
			AuthorizationContextBuilder.read([])
		);
	}

	private fakeUndefinedAsString = (): string => {
		const value = undefined as unknown as string;

		return value;
	};

	/**
	 * Returns a callback that parses the request range.
	 */
	private getRange(req: Request) {
		return (filesize: number): { start: number; end: number } | undefined => {
			const range = req.range(filesize);

			if (range) {
				if (range === -2) {
					throw new BadRequestException('invalid range');
				}

				if (range === -1) {
					throw new BadRequestException('unsatisfiable range');
				}

				if (range.length > 1) {
					throw new BadRequestException('multipart ranges are unsupported');
				}

				const requestedRange = range[0];

				return requestedRange;
			}

			return undefined;
		};
	}

	public async getAjax(
		query: AjaxGetQueryParams,
		currentUser: ICurrentUser
	): Promise<IHubInfo | ILibraryDetailedDataForClient | IAjaxResponse | undefined> {
		await this.checkUserIsAuthenticatedAndEnrolled(currentUser);

		const user = this.changeUserType(currentUser.userId);
		const language = await this.getUserLanguage(currentUser.userId);

		const result = await this.h5pAjaxEndpoint.getAjax(
			query.action,
			query.machineName,
			query.majorVersion,
			query.minorVersion,
			language,
			user
		);

		if (query.action === 'content-type-cache') {
			// filter response for libraries not contained in whitelist
			const ajaxResponse = result as IHubInfo;
			if (ajaxResponse && Array.isArray(ajaxResponse.libraries)) {
				const libraryWhiteList = getLibraryWhiteList(this.config.libraryListPath);
				ajaxResponse.libraries = ajaxResponse.libraries.filter((library) =>
					libraryWhiteList.includes(library.machineName)
				);
			}
		}

		return result;
	}

	public async postAjax(
		currentUser: ICurrentUser,
		query: AjaxPostQueryParams,
		body: AjaxPostBodyParams,
		contentFile?: Express.Multer.File,
		h5pFile?: Express.Multer.File
	): Promise<
		| AjaxSuccessResponse
		| {
				height?: number;
				mime: string;
				path: string;
				width?: number;
		  }
		| ILibraryOverviewForClient[]
		| undefined
	> {
		await this.checkUserIsAuthenticatedAndEnrolled(currentUser);

		let contentUploadFile: H5PUploadFile | undefined;
		try {
			const user = this.changeUserType(currentUser.userId);
			const language = await this.getUserLanguage(currentUser.userId);
			contentUploadFile = await this.createContentUploadFile(contentFile);
			const libraryUploadFile = this.createLibraryUploadFile(h5pFile);

			const result = await this.h5pAjaxEndpoint.postAjax(
				query.action,
				body,
				language,
				user,
				contentUploadFile,
				query.id,
				undefined,
				libraryUploadFile
			);

			return result;
		} catch (err) {
			throw new InternalServerErrorException('Error processing H5P AJAX request', { cause: err });
		} finally {
			if (this.isTemporarySvgFile(contentUploadFile) && contentUploadFile.tempFilePath) {
				this.deleteTemporarySvgFile(contentUploadFile.tempFilePath);
			}
		}
	}

	private async createContentUploadFile(contentFile?: Express.Multer.File): Promise<H5PUploadFile | undefined> {
		let contentTempFilePath = UNKNOWN_TYPE;
		let contentData = contentFile?.buffer;

		if (this.isSvgFile(contentFile)) {
			contentTempFilePath = await this.createTemporarySvgFile(contentFile);
			contentData = undefined;
		}

		const contentUploadFile: H5PUploadFile | undefined = contentFile && {
			data: contentData,
			mimetype: contentFile.mimetype,
			name: contentFile.originalname,
			size: contentFile.size,
			tempFilePath: contentTempFilePath,
		};

		return contentUploadFile;
	}

	private isSvgFile(contentFile?: Express.Multer.File): contentFile is Express.Multer.File {
		const isSvgFile = !!contentFile && contentFile.originalname.endsWith('.svg');

		return isSvgFile;
	}

	private async createTemporarySvgFile(contentFile: Express.Multer.File): Promise<string> {
		const contentTempDir = mkdtempSync(join(tmpdir(), 'h5p-svg-'));
		const contentTempFileName = randomUUID() + '.svg';
		const contentTempFilePath = join(contentTempDir, contentTempFileName);
		await writeFile(contentTempFilePath, contentFile.buffer, 'utf8');
		this.logger.info(new H5PUcLoggable(`SVG file written to temporary location: ${contentTempFilePath}`));

		return contentTempFilePath;
	}

	private createLibraryUploadFile(h5pFile?: Express.Multer.File): H5PUploadFile | undefined {
		const libraryUploadFile: H5PUploadFile | undefined = h5pFile && {
			data: h5pFile?.buffer,
			mimetype: h5pFile.mimetype,
			name: h5pFile.originalname,
			size: h5pFile.size,
			tempFilePath: UNKNOWN_TYPE,
		};

		return libraryUploadFile;
	}

	private isTemporarySvgFile(contentUploadFile: H5PUploadFile | undefined): contentUploadFile is H5PUploadFile {
		const isTemporarySvgFile =
			!!contentUploadFile && !!contentUploadFile.tempFilePath && contentUploadFile.tempFilePath !== UNKNOWN_TYPE;

		return isTemporarySvgFile;
	}

	private deleteTemporarySvgFile(filePath: string): void {
		const dirPath = dirname(filePath);
		try {
			unlinkSync(filePath);
			rmSync(dirPath, { recursive: true });
			this.logger.info(new H5PUcLoggable(`Temporary SVG file and directory deleted: ${filePath}`));
		} catch (err) {
			this.logger.warning(new H5PUcErrorLoggable(err, { filePath }, 'while deleting temporary SVG file or directory'));
		}
	}

	public async getContentParameters(contentId: string, userId: EntityId): Promise<H5PContentResponse> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(userId);

		try {
			const result: H5PContentResponse = await this.h5pAjaxEndpoint.getContentParameters(contentId, user);

			return result;
		} catch (err) {
			throw new NotFoundException();
		}
	}

	public async getContentFile(
		contentId: string,
		file: string,
		req: Request,
		userId: EntityId
	): Promise<GetLibraryFile> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(userId);

		try {
			const rangeCallback = this.getRange(req);
			const { mimetype, range, stats, stream } = await this.h5pAjaxEndpoint.getContentFile(
				contentId,
				file,
				user,
				rangeCallback
			);

			return {
				data: stream,
				contentType: mimetype,
				contentLength: stats.size,
				contentRange: range, // Range can be undefined, typings from @lumieducation/h5p-server are wrong
			};
		} catch (err) {
			throw new NotFoundException();
		}
	}

	public async getLibraryFile(ubername: string, file: string, currentUser: ICurrentUser): Promise<GetLibraryFile> {
		await this.checkUserIsAuthenticatedAndEnrolled(currentUser);
		try {
			const { mimetype, size, stream } = await this.libraryService.getLibraryFile(ubername, file);

			return {
				data: stream,
				contentType: mimetype,
				contentLength: size as number,
			};
		} catch (err) {
			throw new NotFoundException();
		}
	}

	public async getTemporaryFile(file: string, req: Request, currentUser: ICurrentUser): Promise<GetLibraryFile> {
		await this.checkUserIsAuthenticatedAndEnrolled(currentUser);
		const user = this.changeUserType(currentUser.userId);

		try {
			const rangeCallback = this.getRange(req);
			// @ts-expect-error rangeCallback can return undefined, typings from @lumieducation/h5p-server are wrong
			const { mimetype, range, stats, stream } = await this.h5pAjaxEndpoint.getTemporaryFile(file, user, rangeCallback);

			return {
				data: stream,
				contentType: mimetype,
				contentLength: stats.size,
				contentRange: range, // Range can be undefined, typings from @lumieducation/h5p-server are wrong
			};
		} catch (err) {
			throw new NotFoundException();
		}
	}

	public async getH5pPlayer(userId: EntityId, contentId: string): Promise<IPlayerModel> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(userId);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const playerModel: IPlayerModel = await this.h5pPlayer.render(contentId, user);

		return playerModel;
	}

	public async getEmptyH5pEditor(currentUser: ICurrentUser, language: LanguageType): Promise<IEditorModel> {
		await this.checkUserIsAuthenticatedAndEnrolled(currentUser);
		const user = this.changeUserType(currentUser.userId);
		const fakeUndefinedString = this.fakeUndefinedAsString();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const createdH5PEditor: IEditorModel = await this.h5pEditor.render(
			fakeUndefinedString, // Lumi typings are wrong because they dont "use strict", this method actually accepts both string and undefined
			language,
			user
		);

		return createdH5PEditor;
	}

	public async getH5pEditor(
		userId: EntityId,
		contentId: string,
		language: LanguageType
	): Promise<{
		editorModel: IEditorModel;
		content: {
			h5p: IContentMetadata;
			library: string;
			params: {
				metadata: IContentMetadata;
				params: ContentParameters;
			};
		};
	}> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.changeUserType(userId);

		const [editorModel, content] = await Promise.all([
			this.h5pEditor.render(contentId, language, user) as Promise<IEditorModel>,
			this.h5pEditor.getContent(contentId, user),
		]);

		return {
			editorModel,
			content,
		};
	}

	public async deleteH5pContent(userId: EntityId, contentId: string): Promise<boolean> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.changeUserType(userId);
		let deletedContent = false;
		try {
			await this.h5pEditor.deleteContent(contentId, user);
			deletedContent = true;
		} catch (error) {
			deletedContent = false;
			throw new HttpException('message', 400, {
				cause: new NotAcceptableException(error as string, 'content not found'),
			});
		}

		return deletedContent;
	}

	public async createH5pContentGetMetadata(
		userId: EntityId,
		schoolId: EntityId,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user: LumiUserWithContentData = this.createAugmentedLumiUser(userId, schoolId, parentType, parentId);
		const fakeAsString: string = this.fakeUndefinedAsString();

		const newContentId = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
			fakeAsString, // Lumi typings are wrong because they dont "use strict", this method actually accepts both string and undefined
			params,
			metadata,
			mainLibraryUbername,
			user
		);

		return newContentId;
	}

	public async saveH5pContentGetMetadata(
		contentId: string,
		userId: EntityId,
		schoolId: EntityId,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user: LumiUserWithContentData = this.createAugmentedLumiUser(userId, schoolId, parentType, parentId);

		const newContentId = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
			contentId,
			params,
			metadata,
			mainLibraryUbername,
			user
		);

		return newContentId;
	}

	private changeUserType(userId: EntityId): LumiIUser {
		const user: LumiIUser = {
			email: '',
			id: userId,
			name: '',
			type: '',
		};

		return user;
	}

	private createAugmentedLumiUser(
		userId: EntityId,
		schoolId: EntityId,
		contentParentType: H5PContentParentType,
		contentParentId: EntityId
	): LumiUserWithContentData {
		const user: LumiUserWithContentData = new LumiUserWithContentData(this.changeUserType(userId), {
			parentType: contentParentType,
			parentId: contentParentId,
			schoolId,
		});

		return user;
	}

	private async getUserLanguage(userId: EntityId): Promise<string> {
		const languageUser = await this.userService.findById(userId);
		let userLanguage = LanguageType.DE;
		if (languageUser?.language) {
			userLanguage = languageUser.language;
		}
		return userLanguage;
	}
}
