import { Controller, Get, Param, Req, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetFileResponse } from '@src/modules/files-storage/interface';
import { Request } from 'express';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { ExportCourseParams } from './dto';
import { CourseExportBodyResponse } from './dto/course-export-body.response';

@ApiTags('common-cartridge')
@Controller('common-cartridge')
export class CommonCartridgeController {
	constructor(private readonly commonCartridgeUC: CommonCartridgeUc) {}

	@Get('export/:parentId')
	public async exportCourse(@Param() exportCourseParams: ExportCourseParams): Promise<CourseExportBodyResponse> {
		return this.commonCartridgeUC.exportCourse(exportCourseParams.parentId);
	}

	@Get('export/download')
	public async exportJustFile(@Req() req: Request): Promise<StreamableFile> {
		const files = await this.commonCartridgeUC.exportJustFile();

		return this.streamFileToClient(req, files);
	}

	private streamFileToClient(req: Request, fileResponse: GetFileResponse): StreamableFile {
		req.on('close', () => fileResponse.data.destroy());
		const streamableFile = this.mapToStreamableFile(fileResponse);

		return streamableFile;
	}

	private mapToStreamableFile(fileResponse: GetFileResponse): StreamableFile {
		let disposition: string;

		if (fileResponse.contentType === 'application/pdf') {
			disposition = `inline;`;
		} else {
			disposition = `attachment;`;
		}

		const streamableFile = new StreamableFile(fileResponse.data, {
			type: fileResponse.contentType,
			disposition: `${disposition} filename="${encodeURI(fileResponse.name)}"`,
			length: fileResponse.contentLength,
		});

		return streamableFile;
	}
}
