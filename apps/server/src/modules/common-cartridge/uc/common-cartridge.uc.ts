import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeExportService, CommonCartridgeImportService } from '../service';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly exportService: CommonCartridgeExportService,
		private readonly importService: CommonCartridgeImportService
	) {}

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

	public async importCourse(file: Buffer): Promise<void> {
		await this.importService.importFile(file);
	}
}
