import {
	Body,
	Controller,
	Get,
	Headers,
	Param,
	Post,
	Req,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Express, Request } from 'express';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { FileDownloadDto, FileDto, FileMetaDto } from './dto/file.dto';

@ApiTags('files-storage')
@Authenticate('jwt')
@Controller('files-storage')
export class FilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@Post('upload/:schoolId/:targetType/:targetId')
	uploadFile(
		@Body() _: FileDto,
		@UploadedFile() file: Express.Multer.File,
		@Param() params: FileMetaDto,
		@CurrentUser() currentUser: ICurrentUser
	) {
		const res = this.filesStorageUC.upload(currentUser.userId, params, file);
		return res;
	}

	@ApiConsumes('application/octet-stream', 'multipart/form-data')
	@Post('upload-stream/:schoolId/:targetType/:targetId')
	async uploadAsStream(
		@Body() _: FileDto,
		@Param() params: FileMetaDto,
		@CurrentUser() currentUser: ICurrentUser,
		@Headers('x-file-name') _fileName: string,
		@Req() req: Request
	) {
		const res = this.filesStorageUC.uploadAsStream(currentUser.userId, params, req);

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
