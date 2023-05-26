import { H5PAjaxEndpoint, H5pError } from '@lumieducation/h5p-server';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { Readable } from 'stream';

import { H5PEditorService } from '../service/h5p-editor.service';
import { H5PPlayerService } from '../service/h5p-player.service';

// ToDo
const dummyUser = {
	canCreateRestricted: true,
	canInstallRecommended: true,
	canUpdateAndInstallLibraries: true,
	email: '',
	id: '',
	name: '',
	type: '',
};

@Injectable()
export class H5PEditorUc {
	private h5pAjaxEndpoint: H5PAjaxEndpoint;

	constructor(private h5pEditorService: H5PEditorService, private h5pPlayerService: H5PPlayerService) {
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

		return new InternalServerErrorException(error);
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

	// Todo
	public async postAjax(action: string) {
		const result = this.h5pAjaxEndpoint.postAjax(action);

		return result;
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
	}

	public async getLibraryFile(ubername: string, file: string) {
		const { mimetype, stats, stream } = await this.h5pAjaxEndpoint.getLibraryFile(ubername, file);

		return {
			data: stream,
			contentType: mimetype,
			contentLength: stats.size,
		};
	}
}
