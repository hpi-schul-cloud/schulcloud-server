import { Body, Controller, Get, Param, Post, Req, StreamableFile } from '@nestjs/common';
import { ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Request } from 'express';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { FileDownloadDto, FileDto, FileMetaDto } from './dto/file.dto';

@ApiTags('files-storage')
@Authenticate('jwt')
@Controller('files-storage')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiConsumes('multipart/form-data')
	@Post('upload/:schoolId/:targetType/:targetId')
	async uploadAsStream(
		@Body() _: FileDto,
		@Param() params: FileMetaDto,
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request
	) {
		const res = this.filesStorageUC.upload(currentUser.userId, params, req);

		return res;
	}

	@ApiProperty({ type: String })
	@Get('/download/:fileRecordId/:fileName')
	async download(@Param() params: FileDownloadDto, @CurrentUser() currentUser: ICurrentUser) {
		const res = await this.filesStorageUC.download(currentUser.userId, params);
		// @TODO set headers ?
		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `attachment; filename="${params.fileName}"`,
		});
	}
}
