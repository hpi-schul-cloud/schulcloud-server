import { H5PAjaxEndpoint, H5PEditor, H5PPlayer, H5pError, IContentMetadata, IUser } from '@lumieducation/h5p-server';
import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Request } from 'express';
import { Readable } from 'stream';
import { UserRepo } from '@shared/repo';
import { AjaxGetQueryParams, AjaxPostBodyParams, AjaxPostQueryParams } from '../controller/dto';

@Injectable()
export class H5PEditorUc {
	constructor(
		private h5pEditor: H5PEditor,
		private h5pPlayer: H5PPlayer,
		private h5pAjaxEndpoint: H5PAjaxEndpoint,
		private readonly userRepo: UserRepo
	) {}

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

		try {
			const result = await this.h5pAjaxEndpoint.getAjax(
				query.action,
				query.machineName,
				query.majorVersion,
				query.minorVersion,
				query.language,
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

		try {
			const filesFile = files?.find((file) => file.fieldname === 'file');
			const libraryUploadFile = files?.find((file) => file.fieldname === 'h5p');
			const language = await this.getUserLanguage(currentUser);

			const result = await this.h5pAjaxEndpoint.postAjax(
				query.action,
				body,
				language, // TODO: Language
				user,
				filesFile && {
					data: filesFile.buffer,
					mimetype: filesFile.mimetype,
					name: filesFile.originalname,
					size: filesFile.size,
				},
				query.id,
				undefined, // TODO: Translation callback
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
			const { mimetype, stats, stream } = await this.h5pAjaxEndpoint.getLibraryFile(ubername, file);

			return {
				data: stream,
				contentType: mimetype,
				contentLength: stats.size,
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

	public async getH5pPlayer(currentUser: ICurrentUser, contentId: string): Promise<string> {
		// TODO: await this.checkPermission...
		const user = this.changeUserType(currentUser);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const h5pPlayerHtml: string = await this.h5pPlayer.render(contentId, user);
		return h5pPlayerHtml;
	}

	public async getH5pEditor(currentUser: ICurrentUser, contentId: string): Promise<string> {
		// If contentId is undefined, a new H5P content will be created.
		// TODO: await this.checkPermission...
		// TODO: implement language from currentUser
		const language = await this.getUserLanguage(currentUser);
		const user = this.changeUserType(currentUser);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const createdH5PEditor: string = await this.h5pEditor.render(contentId, language, user);

		return createdH5PEditor;
	}

	public async deleteH5pContent(currentUser: ICurrentUser, contentId: string): Promise<boolean> {
		// TODO: await this.checkPermission...
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

	public async saveH5pContentGetMetadata(
		contentId: string,
		currentUser: ICurrentUser,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string
	): Promise<{ id: string; metadata: IContentMetadata }> {
		// TODO: await this.checkPermission...
		const user = this.changeUserType(currentUser);

		const newContentId = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
			contentId, // Typings are wrong
			params,
			metadata,
			mainLibraryUbername,
			user
		);

		return newContentId;
	}

	private changeUserType(currentUser: ICurrentUser): IUser {
		// TODO: declare IUser (e.g. add roles, schoolId, etc.)
		const user: IUser = {
			canCreateRestricted: true,
			canInstallRecommended: true,
			canUpdateAndInstallLibraries: true,
			email: '',
			id: currentUser.userId,
			name: '',
			type: '',
		};
		return user;
	}

	private async getUserLanguage(currentUser: ICurrentUser): Promise<string> {
		const languageUser = await this.userRepo.findById(currentUser.userId);
		let language = 'de';
		if (languageUser.language) {
			language = languageUser.language.toString();
		}
		return language;
	}
}
