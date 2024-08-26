import { ICurrentUser } from '@infra/auth-guard';
import {
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
import {
	BadRequestException,
	HttpException,
	Injectable,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserService } from '@src/modules/user';
import { Request } from 'express';
import { AjaxGetQueryParams, AjaxPostBodyParams, AjaxPostQueryParams } from '../controller/dto';
import { H5PContentParentType } from '../entity';
import { H5PContentMapper } from '../mapper/h5p-content.mapper';
import { H5PErrorMapper } from '../mapper/h5p-error.mapper';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { LumiUserWithContentData } from '../types/lumi-types';
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
	) {
		const allowedType = H5PContentMapper.mapToAllowedAuthorizationEntityType(parentType);
		await this.authorizationClientAdapter.checkPermissionsByReference(allowedType, parentId, context);
	}

	private fakeUndefinedAsString = () => {
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
		currentUser: ICurrentUser
	): Promise<IHubInfo | ILibraryDetailedDataForClient | IAjaxResponse | undefined> {
		const user = this.changeUserType(currentUser);
		const language = await this.getUserLanguage(currentUser);
		const h5pErrorMapper = new H5PErrorMapper();

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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			throw h5pErrorMapper.mapH5pError(err);
		}
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
		const user = this.changeUserType(currentUser);
		const language = await this.getUserLanguage(currentUser);
		const h5pErrorMapper = new H5PErrorMapper();

		try {
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
				},
				undefined // TODO: HubID?
			);

			return result;
		} catch (err) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			throw h5pErrorMapper.mapH5pError(err);
		}
	}

	public async getContentParameters(contentId: string, currentUser: ICurrentUser) {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.read([]));

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
	): Promise<GetLibraryFile> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(currentUser);

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

	public async getTemporaryFile(file: string, req: Request, currentUser: ICurrentUser): Promise<GetLibraryFile> {
		const user = this.changeUserType(currentUser);

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

	public async getH5pPlayer(currentUser: ICurrentUser, contentId: string): Promise<IPlayerModel> {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.read([]));

		const user = this.changeUserType(currentUser);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const playerModel: IPlayerModel = await this.h5pPlayer.render(contentId, user);

		return playerModel;
	}

	public async getEmptyH5pEditor(currentUser: ICurrentUser, language: LanguageType) {
		const user = this.changeUserType(currentUser);
		const fakeUndefinedString = this.fakeUndefinedAsString();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const createdH5PEditor: IEditorModel = await this.h5pEditor.render(
			fakeUndefinedString, // Lumi typings are wrong because they dont "use strict", this method actually accepts both string and undefined
			language,
			user
		);

		return createdH5PEditor;
	}

	public async getH5pEditor(currentUser: ICurrentUser, contentId: string, language: LanguageType) {
		const { parentType, parentId } = await this.h5pContentRepo.findById(contentId);
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

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
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.changeUserType(currentUser);
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
		currentUser: ICurrentUser,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

		const user = this.createAugmentedLumiUser(currentUser, parentType, parentId);
		const fakeAsString = this.fakeUndefinedAsString();

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
		currentUser: ICurrentUser,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string,
		parentType: H5PContentParentType,
		parentId: EntityId
	): Promise<{ id: string; metadata: IContentMetadata }> {
		await this.checkContentPermission(parentType, parentId, AuthorizationContextBuilder.write([]));

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
		let userLanguage = LanguageType.DE;
		if (languageUser?.language) {
			userLanguage = languageUser.language;
		}
		return userLanguage;
	}
}
