/* eslint-disable filename-rules/match */
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
	IAjaxResponse,
	IHubInfo,
	ILibraryDetailedDataForClient,
	ILibraryOverviewForClient,
} from '@lumieducation/h5p-server/build/src/types';
import { UserService } from '@modules/user';
import {
	BadRequestException,
	HttpException,
	Injectable,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { LanguageType } from '@shared/domain/interface';
import { PassThrough, Readable } from 'stream';
import { EntityId } from '@shared/domain/types';
import { Request } from 'express';
import { AjaxGetQueryParams, AjaxPostBodyParams, AjaxPostQueryParams, H5PContentResponse } from '../controller/dto';
import { H5PContentMapper } from '../mapper/h5p-content.mapper';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { H5PContentParentType, LumiUserWithContentData } from '../types';
import { GetLibraryFile } from './dto/h5p-getLibraryFile';

@Injectable()
export class H5PEditorUc {
	constructor(
		private readonly h5pEditor: H5PEditor,
		private readonly h5pPlayer: H5PPlayer,
		private readonly h5pAjaxEndpoint: H5PAjaxEndpoint,
		private readonly libraryService: LibraryStorage,
		private readonly userService: UserService,
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly h5pContentRepo: H5PContentRepo
	) {}

	private async checkContentPermission(
		parentType: H5PContentParentType,
		parentId: EntityId,
		context: AuthorizationContextParams
	): Promise<void> {
		const allowedType: AuthorizationBodyParamsReferenceType =
			H5PContentMapper.mapToAllowedAuthorizationEntityType(parentType);

		await this.authorizationClientAdapter.checkPermissionsByReference(allowedType, parentId, context);
	}

	private fakeUndefinedAsString = (): string => {
		const value = undefined as unknown as string;

		return value;
	};

	/**
	 * Returns a callback that parses the request range.
	 */
	private getRange(req: Request) {
		return (filesize: number) => {
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

				return range[0];
			}

			return undefined;
		};
	}

	public async getAjax(
		query: AjaxGetQueryParams,
		userId: EntityId
	): Promise<IHubInfo | ILibraryDetailedDataForClient | IAjaxResponse | undefined> {
		const user = this.changeUserType(userId);
		const language = await this.getUserLanguage(userId);

		const result = await this.h5pAjaxEndpoint.getAjax(
			query.action,
			query.machineName,
			query.majorVersion,
			query.minorVersion,
			language,
			user
		);
		return result;
	}

	public async postAjax(
		userId: EntityId,
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
		const user = this.changeUserType(userId);
		const language = await this.getUserLanguage(userId);

		const result = await this.h5pAjaxEndpoint.postAjax(
			query.action,
			body,
			language,
			user,
			contentFile && {
				data: contentFile.buffer,
				mimetype: contentFile.mimetype,
				name: contentFile.originalname,
				size: contentFile.size,
			},
			query.id,
			undefined,
			h5pFile && {
				data: h5pFile.buffer,
				mimetype: h5pFile.mimetype,
				name: h5pFile.originalname,
				size: h5pFile.size,
			}
		);

		return result;
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

	public async getLibraryFile(ubername: string, file: string): Promise<GetLibraryFile> {
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

	public async getTemporaryFile(file: string, req: Request, userId: EntityId): Promise<GetLibraryFile> {
		const user = this.changeUserType(userId);

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

	public async getEmptyH5pEditor(userId: EntityId, language: LanguageType) {
		const user = this.changeUserType(userId);
		const fakeUndefinedString = this.fakeUndefinedAsString();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const createdH5PEditor: IEditorModel = await this.h5pEditor.render(
			fakeUndefinedString, // Lumi typings are wrong because they dont "use strict", this method actually accepts both string and undefined
			language,
			user
		);

		return createdH5PEditor;
	}

	public async getH5pEditor(userId: EntityId, contentId: string, language: LanguageType) {
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

	public async streamH5pPackage(contentId: string, userId: EntityId): Promise<Readable> {
		const stream = new PassThrough();
		const user = this.changeUserType(userId);
		await this.h5pEditor.exportContent(contentId, stream, user).catch((err: unknown) => {
			if (err instanceof Error || err === undefined) {
				stream.destroy(err);
			} else {
				stream.destroy(new Error(String(err)));
			}
		});
		return stream;
	}

	public async importH5pFile(
		userId: EntityId,
		schoolId: EntityId,
		params: unknown,
		metadata: IContentMetadata,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user: LumiUserWithContentData = this.createAugmentedLumiUser(userId, schoolId, parentType, parentId);

		const newContentId = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
			this.fakeUndefinedAsString(),
			params,
			metadata,
			metadata.mainLibrary, // Pass mainLibraryUbername as the fourth argument
			user
		);
		const query = { action: 'library-upload' } as AjaxPostQueryParams;
		const body = {} as AjaxPostBodyParams;
		await this.postAjax(userId, query, body, undefined);
		return newContentId;
	}

	public async saveUploadedFileTemp(userId: EntityId, file: Express.Multer.File): Promise<string> {
		const user = this.changeUserType(userId);

		// Use postAjax with 'library-upload' action to save the file temporarily
		const query: AjaxPostQueryParams = { action: 'library-upload' };
		const body: AjaxPostBodyParams = {
			contentId: '',
			field: '',
		};
		const result = await this.h5pAjaxEndpoint.postAjax(
			query.action,
			body,
			await this.getUserLanguage(userId),
			user,
			undefined,
			undefined,
			undefined,
			{
				data: file.buffer,
				mimetype: file.mimetype,
				name: file.originalname,
				size: file.size,
			}
		);

		// Extract the temp file path from the result if available
		if (result && typeof result === 'object' && 'path' in result && typeof result.path === 'string') {
			return result.path;
		}

		throw new Error('Failed to save uploaded file temporarily.');
	}
}
