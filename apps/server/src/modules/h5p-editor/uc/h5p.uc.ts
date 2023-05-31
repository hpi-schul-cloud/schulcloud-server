import { H5PAjaxEndpoint, H5pError, IContentMetadata, IUser } from '@lumieducation/h5p-server';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { Readable } from 'stream';

import { ICurrentUser } from '@src/modules/authentication';
import { H5PAjaxPostBody, PostH5PAjaxQueryParams } from '../controller/dto/h5p-ajax.params';
import { H5PEditorService } from '../service/h5p-editor.service';
import { H5PPlayerService } from '../service/h5p-player.service';

// ToDo
const dummyUser = {
	canCreateRestricted: true,
	canInstallRecommended: true,
	canUpdateAndInstallLibraries: true,
	email: '',
	id: 'dummyId',
	name: 'Dummy User',
	type: '',
};

@Injectable()
export class H5PEditorUc {
	private h5pAjaxEndpoint: H5PAjaxEndpoint;

	constructor(public readonly h5pEditorService: H5PEditorService, private h5pPlayerService: H5PPlayerService) {
		this.h5pAjaxEndpoint = new H5PAjaxEndpoint(h5pEditorService.h5pEditor);
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

	public async getAjax(
		action: string,
		machineName?: string,
		majorVersion?: string,
		minorVersion?: string,
		language?: string
	) {
		try {
			const result = await this.h5pAjaxEndpoint.getAjax(
				action,
				machineName,
				majorVersion,
				minorVersion,
				language,
				dummyUser
			);

			return result;
		} catch (err) {
			throw this.mapH5pError(err);
		}
	}

	public async postAjax(query: PostH5PAjaxQueryParams, body: H5PAjaxPostBody, files?: Express.Multer.File[]) {
		try {
			const filesFile = files?.find((file) => file.fieldname === 'file');
			const libraryUploadFile = files?.find((file) => file.fieldname === 'h5p');

			const result = await this.h5pAjaxEndpoint.postAjax(
				query.action,
				body,
				undefined, // Todo: Language
				dummyUser, // Todo: User
				filesFile && {
					data: filesFile.buffer,
					mimetype: filesFile.mimetype,
					name: filesFile.originalname,
					size: filesFile.size,
				},
				query.id,
				undefined, // Todo: Translation callback
				libraryUploadFile && {
					data: libraryUploadFile.buffer,
					mimetype: libraryUploadFile.mimetype,
					name: libraryUploadFile.originalname,
					size: libraryUploadFile.size,
				},
				undefined // Todo: HubID?
			);

			return result;
		} catch (err) {
			throw this.mapH5pError(err);
		}
	}

	public async getContentParameters(contentId: string) {
		try {
			const result = await this.h5pAjaxEndpoint.getContentParameters(contentId, dummyUser);

			return result;
		} catch (err) {
			throw this.mapH5pError(err);
		}
	}

	public async getContentFile(
		contentId: string,
		file: string,
		req: Request
	): Promise<{
		data: Readable;
		contentType: string;
		contentLength: number;
		contentRange?: { start: number; end: number };
	}> {
		try {
			const { mimetype, range, stats, stream } = await this.h5pAjaxEndpoint.getContentFile(
				contentId,
				file,
				dummyUser,
				this.getRange(req)
			);

			return {
				data: stream,
				contentType: mimetype,
				contentLength: stats.size,
				contentRange: range, // Range can be undefined, typings from @lumieducation/h5p-server are wrong
			};
		} catch (err) {
			throw this.mapH5pError(err);
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
			throw this.mapH5pError(err);
		}
	}

	public async getTemporaryFile(
		file: string,
		req: Request
	): Promise<{
		data: Readable;
		contentType: string;
		contentLength: number;
		contentRange?: { start: number; end: number };
	}> {
		try {
			const { mimetype, range, stats, stream } = await this.h5pAjaxEndpoint.getTemporaryFile(
				file,
				dummyUser,
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
			throw this.mapH5pError(err);
		}
	}

	public async getH5pPlayer(currentUser: ICurrentUser, contentId: string): Promise<string> {
		// TODO: await this.checkPermission...
		const user = this.changeUserType(currentUser);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const h5pPlayerHtml: string = await this.h5pPlayerService.h5pPlayer.render(contentId, user);
		return h5pPlayerHtml;
	}

	public async createH5PEditor(currentUser: ICurrentUser, language: string): Promise<string> {
		// TODO: await this.checkPermission...
		const contentId = undefined as unknown as string;
		const createdH5PEditor: Promise<string> = this.editH5pContent(currentUser, contentId, language);
		return createdH5PEditor;
	}

	public async editH5pContent(currentUser: ICurrentUser, contentId: string, language: string): Promise<string> {
		// TODO: await this.checkPermission...
		const user = this.changeUserType(currentUser);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const createdH5PEditor: string = await this.h5pEditorService.h5pEditor.render(contentId, language, user);

		return createdH5PEditor;
	}

	public async deleteH5pContent(currentUser: ICurrentUser, contentId: string): Promise<boolean> {
		// TODO: await this.checkPermission...
		const user = this.changeUserType(currentUser);
		let deletedContent = false;
		try {
			await this.h5pEditorService.h5pEditor.deleteContent(contentId, user);
			deletedContent = true;
		} catch (error) {
			deletedContent = false;
			throw new Error(error as string);
		}

		return deletedContent;
	}

	public async saveH5pContent(
		currentUser: ICurrentUser,
		contentId: string,
		params: unknown,
		metadata: IContentMetadata,
		mainLibraryUbername: string
	): Promise<string> {
		// TODO: await this.checkPermission...
		const user = this.changeUserType(currentUser);

		const newContentId = await this.h5pEditorService.h5pEditor.saveOrUpdateContent(
			contentId,
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
			canCreateRestricted: false,
			canInstallRecommended: false,
			canUpdateAndInstallLibraries: false,
			email: '',
			id: currentUser.userId,
			name: '',
			type: '',
		};
		return user;
	}
}
