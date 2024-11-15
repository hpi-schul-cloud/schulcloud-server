import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';

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
