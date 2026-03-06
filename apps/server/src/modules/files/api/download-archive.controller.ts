import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	ForbiddenException,
	Get,
	HttpStatus,
	Inject,
	InternalServerErrorException,
	NotImplementedException,
	Query,
	Req,
	Res,
	StreamableFile,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { Request, Response } from 'express';
import { GetFileResponse } from '../domain';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../legacy-file-archive.config';
import { DownloadArchiveUC } from './download-archive.uc';
import { ArchiveFileParams } from './dto';
import { StreamableFileMapper } from './mapper';

@ApiTags('DownloadArchive')
@Controller('filestorage/files/archive')
@JwtAuthentication()
export class LegacyFileArchiveController {
	constructor(
		private readonly downloadArchiveUC: DownloadArchiveUC,
		@Inject(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN) private readonly config: LegacyFileArchiveConfig
	) {}

	@ApiOperation({ summary: 'Download multiple files as a zip' })
	@ApiResponse({
		status: 200,
		schema: { type: 'string', format: 'binary' },
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@ApiResponse({ status: 501, type: NotImplementedException })
	@ApiHeader({ name: 'Range', required: false })
	@Get()
	public async downloadFilesAsArchive(
		@Query() params: ArchiveFileParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request,
		@Res({ passthrough: true }) response: Response
	): Promise<StreamableFile | void> {
		this.featureEnabled();

		const data = await this.downloadArchiveUC.downloadFilesOfParentAsArchive(
			params,
			currentUser.userId,
			currentUser.roles
		);
		const streamableFile = this.streamFileToClient(req, data, response);

		return streamableFile;
	}

	private featureEnabled(): void {
		if (!this.config.featureTeamArchiveDownload) {
			throw new NotImplementedException('Feature not enabled');
		}
	}

	private streamFileToClient(req: Request, fileResponse: GetFileResponse, httpResponse: Response): StreamableFile {
		req.on('close', () => fileResponse.data.destroy());
		httpResponse.status(HttpStatus.OK);

		const streamableFile = StreamableFileMapper.fromResponse(fileResponse);

		return streamableFile;
	}
}
