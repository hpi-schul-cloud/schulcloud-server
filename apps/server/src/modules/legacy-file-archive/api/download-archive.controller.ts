import {
	Body,
	Controller,
	ForbiddenException,
	HttpStatus,
	InternalServerErrorException,
	Post,
	Req,
	Res,
	StreamableFile,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { Request, Response } from 'express';
import { GetFileResponse } from '../domain/interface/get-file-response';
import { DownloadArchiveUC } from './download-archive.uc';
import { ArchiveFileParams } from './dto';
import { StreamableFileMapper } from './mapper';
import { JwtAuthentication } from '@infra/auth-guard';

@ApiTags('DownloadArchive')
@Controller('download-archive')
@JwtAuthentication()
export class DownloadArchiveController {
	constructor(private readonly downloadArchiveUC: DownloadArchiveUC) {}

	@ApiOperation({ summary: 'Download multiple files as a zip' })
	@ApiResponse({
		status: 200,
		schema: { type: 'string', format: 'binary' },
	})
	@ApiResponse({
		status: 206,
		schema: { type: 'string', format: 'binary' },
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@ApiHeader({ name: 'Range', required: false })
	@Post('/download-files-as-archive')
	public async downloadFilesAsArchive(
		@Body() params: ArchiveFileParams,
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile | void> {
		const data = await this.downloadArchiveUC.downloadFilesOfParentAsArchive(params);

		const streamableFile = this.streamFileToClient(req, data, response);

		return streamableFile;
	}

	private streamFileToClient(
		req: Request,
		fileResponse: GetFileResponse,
		httpResponse: Response,
		bytesRange?: string
	): StreamableFile {
		req.on('close', () => fileResponse.data.destroy());

		// If bytes range has been defined, set Accept-Ranges and Content-Range HTTP headers
		// in a response and also set 206 Partial Content HTTP status code to inform the caller
		// about the partial data stream. Otherwise, just set a 200 OK HTTP status code.
		if (bytesRange) {
			httpResponse.set({
				'Accept-Ranges': 'bytes',
				'Content-Range': fileResponse.contentRange,
			});

			httpResponse.status(HttpStatus.PARTIAL_CONTENT);
		} else {
			httpResponse.status(HttpStatus.OK);
		}

		const streamableFile = StreamableFileMapper.fromResponse(fileResponse);

		return streamableFile;
	}
}
