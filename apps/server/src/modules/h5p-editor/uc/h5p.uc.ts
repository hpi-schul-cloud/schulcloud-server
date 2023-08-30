import {
	H5PAjaxEndpoint,
	H5PEditor,
	H5PPlayer,
	H5pError,
	IContentMetadata,
	IEditorModel,
	IPlayerModel,
	IUser as LumiIUser,
} from '@lumieducation/h5p-server';
import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { EntityId, LanguageType } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService, UserService } from '@src/modules';
import { ICurrentUser } from '@src/modules/authentication';
import { Request } from 'express';
import { Readable } from 'stream';
import { AjaxGetQueryParams, AjaxPostBodyParams, AjaxPostQueryParams } from '../controller/dto';
import { H5PContentParentType } from '../entity';
import { H5PContentMapper } from '../mapper/h5p-content.mapper';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { LumiUserWithContentData } from '../types/lumi-types';

@Injectable()
export class H5PEditorUc {
	constructor(
		private h5pEditor: H5PEditor,
		private h5pPlayer: H5PPlayer,
		private h5pAjaxEndpoint: H5PAjaxEndpoint,
		private libraryService: LibraryStorage,
		private readonly userService: UserService,
		private readonly authorizationService: AuthorizationService,
		private readonly h5pContentRepo: H5PContentRepo
	) {}

	private async checkContentPermission(
		userId: EntityId,
		parentType: H5PContentParentType,
		parentId: EntityId,
		context: AuthorizationContext
	) {
		const allowedType = H5PContentMapper.mapToAllowedAuthorizationEntityType(parentType);
		await this.authorizationService.checkPermissionByReferences(userId, allowedType, parentId, context);
	}

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

	private mapH5pError(error: unknown) {
		if (error instanceof H5pError) {
			return new HttpException(error.message, error.httpStatusCode);
		}

		return new InternalServerErrorException({ error });
	}

	public async getAjax(query: AjaxGetQueryParams, currentUser: ICurrentUser) {
		const user = this.changeUserType(currentUser);
		const language = await this.getUserLanguage(currentUser);

		try {
			const result = await this.h5pAjaxEndpoint.getAjax(
				query.action,
				query.machineName,
				query.majorVersion,
				query.minorVersion,
				language,
				user
			);

			return result;
		} catch (err) {
			throw this.mapH5pError(err);
		}
	}

	public async postAjax(
		currentUser: ICurrentUser,
		query: AjaxPostQueryParams,
		body: AjaxPostBodyParams,
		files?: Express.Multer.File[]
	) {
		const user = this.changeUserType(currentUser);
		const language = await this.getUserLanguage(currentUser);

		try {
			const filesFile = files?.find((file) => file.fieldname === 'file');
			const libraryUploadFile = files?.find((file) => file.fieldname === 'h5p');

			const result = await this.h5pAjaxEndpoint.postAjax(
				query.action,
				body,
				language,
				user,
				filesFile && {
					data: filesFile.buffer,
					mimetype: filesFile.mimetype,
					name: filesFile.originalname,
					size: filesFile.size,
				},
				query.id,
				undefined,
				libraryUploadFile && {
					data: libraryUploadFile.buffer,
					mimetype: libraryUploadFile.mimetype,
					name: libraryUploadFile.originalname,
					size: libraryUploadFile.size,
				},
				undefined // TODO: HubID?
			);

			return result;
		} catch (err) {
			throw this.mapH5pError(err);
		}
	}

	public async getContentParameters(contentId: string, currentUser: ICurrentUser) {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(currentUser);

		try {
			const result = await this.h5pAjaxEndpoint.getContentParameters(contentId, user);

			return result;
		} catch (err) {
			throw new NotFoundException();
		}
	}

	public async getContentFile(
		contentId: string,
		file: string,
		req: Request,
		currentUser: ICurrentUser
	): Promise<{
		data: Readable;
		contentType: string;
		contentLength: number;
		contentRange?: { start: number; end: number };
	}> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(currentUser);

		try {
			const { mimetype, range, stats, stream } = await this.h5pAjaxEndpoint.getContentFile(
				contentId,
				file,
				user,
				this.getRange(req)
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

	public async getLibraryFile(ubername: string, file: string) {
		try {
			const { mimetype, size, stream } = await this.libraryService.getLibraryFile(ubername, file);

			return {
				data: stream,
				contentType: mimetype,
				contentLength: size,
			};
		} catch (err) {
			throw new NotFoundException();
		}
	}

	public async getTemporaryFile(
		file: string,
		req: Request,
		currentUser: ICurrentUser
	): Promise<{
		data: Readable;
		contentType: string;
		contentLength: number;
		contentRange?: { start: number; end: number };
	}> {
		const user = this.changeUserType(currentUser);

		try {
			const { mimetype, range, stats, stream } = await this.h5pAjaxEndpoint.getTemporaryFile(
				file,
				user,
				// @ts-expect-error 2345: Callback can return undefined, typings from @lumieducation/h5p-server are wrong
				this.getRange(req)
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

	public async getH5pPlayer(currentUser: ICurrentUser, contentId: string): Promise<IPlayerModel> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(currentUser);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const playerModel: IPlayerModel = await this.h5pPlayer.render(contentId, user);

		return playerModel;
	}

	public async getEmptyH5pEditor(currentUser: ICurrentUser, language: LanguageType) {
		const user = this.changeUserType(currentUser);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const createdH5PEditor: IEditorModel = await this.h5pEditor.render(
			undefined as unknown as string, // Lumi typings are wrong because they dont "use strict", this method actually accepts both string and undefined
			language,
			user
		);

		return createdH5PEditor;
	}

	public async getH5pEditor(currentUser: ICurrentUser, contentId: string, language: LanguageType) {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.changeUserType(currentUser);

		const [editorModel, content] = await Promise.all([
			this.h5pEditor.render(contentId, language, user) as Promise<IEditorModel>,
			this.h5pEditor.getContent(contentId, user),
		]);

		return {
			editorModel,
			content,
		};
	}

	public async deleteH5pContent(currentUser: ICurrentUser, contentId: string): Promise<boolean> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.changeUserType(currentUser);
		let deletedContent = false;
		try {
			await this.h5pEditor.deleteContent(contentId, user);
			deletedContent = true;
		} catch (error) {
			deletedContent = false;
			throw new Error(error as string);
		}

		return deletedContent;
	}

	public async createH5pContentGetMetadata(
		currentUser: ICurrentUser,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.createAugmentedLumiUser(currentUser, parentType, parentId);

		const newContentId = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
			undefined as unknown as string, // Lumi typings are wrong because they dont "use strict", this method actually accepts both string and undefined
			params,
			metadata,
			mainLibraryUbername,
			user
		);

		return newContentId;
	}

	public async saveH5pContentGetMetadata(
		contentId: string,
		currentUser: ICurrentUser,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(currentUser.userId, parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.createAugmentedLumiUser(currentUser, parentType, parentId);

		const newContentId = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
			contentId,
			params,
			metadata,
			mainLibraryUbername,
			user
		);

		return newContentId;
	}

	private changeUserType(currentUser: ICurrentUser): LumiIUser {
		const user: LumiIUser = {
			canCreateRestricted: false,
			canInstallRecommended: true,
			canUpdateAndInstallLibraries: true,
			email: '',
			id: currentUser.userId,
			name: '',
			type: '',
		};

		return user;
	}

	private createAugmentedLumiUser(
		currentUser: ICurrentUser,
		contentParentType: H5PContentParentType,
		contentParentId: EntityId
	) {
		const user = new LumiUserWithContentData(this.changeUserType(currentUser), {
			parentType: contentParentType,
			parentId: contentParentId,
			schoolId: currentUser.schoolId,
		});

		return user;
	}

	private async getUserLanguage(currentUser: ICurrentUser): Promise<string> {
		const languageUser = await this.userService.findById(currentUser.userId);
		let language = 'de';
		if (languageUser && languageUser.language) {
			language = languageUser.language.toString();
		}
		return language;
	}
}
