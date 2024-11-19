import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CommonCartridgeUc {
	constructor(private readonly exportService: CommonCartridgeExportService) {}

	public async exportCourse(
		courseId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[],
		tasks: string[],
		columnBoards: string[]
	): Promise<Buffer> {
		const exportedCourse = await this.exportService.exportCourse(courseId, version, topics, tasks, columnBoards);

		return exportedCourse;
	}
}
