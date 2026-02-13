import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService, CommonCartridgeProducer } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { ImportCourseParams } from '../domain/import-course.params';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly commonCartridgeProducer: CommonCartridgeProducer
	) {}

	public async exportCourse(
		jwt: string,
		courseId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[],
		tasks: string[],
		columnBoards: string[]
	): Promise<CommonCartridgeExportResponse> {
		const exportedCourse = await this.exportService.exportCourse(jwt, courseId, version, topics, tasks, columnBoards);

		return exportedCourse;
	}

	public startCourseImport(params: ImportCourseParams): void {
		this.commonCartridgeProducer.importCourse(params);
	}
}
