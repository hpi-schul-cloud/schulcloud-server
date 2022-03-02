import { Body, Controller, Get, Put, Query, StreamableFile } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { ScanResultDto } from '@src/modules/files-storage/controller/dto';
import { FilesStorageUC } from '../uc/files-storage.uc';

@ApiTags('files-storage')
@Controller('files-storage')
export class AntivirusFilesStorageController {
	constructor(private readonly filesStorageUC: FilesStorageUC) {}

	@ApiProperty({ type: String })
	@Get('/downloadBySecurityCheckRequestToken')
	async downloadBySecurityCheckRequestToken(@Query('token') token: string) {
		const res = await this.filesStorageUC.downloadBySecurityCheckRequestToken(token);

		// @TODO set headers ?
		return new StreamableFile(res.data, {
			type: res.contentType,
			disposition: `attachment;`,
		});
	}

	@ApiProperty({ type: String })
	@Put('/updateSecurityStatus')
	async updateSecurityStatus(@Body() scanResultDto: ScanResultDto, @Query('token') token: string) {
		await this.filesStorageUC.updateSecurityStatus(token, scanResultDto);
	}
}
