import { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportService, CommonCartridgeImportService } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';

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
	): Promise<CommonCartridgeExportResponse> {
		const exportedCourse = await this.exportService.exportCourse(courseId, version, topics, tasks, columnBoards);

		return exportedCourse;
	}

	public async importCourse(file: Buffer, currentUser: ICurrentUser): Promise<void> {
		await this.importService.importFile(file, currentUser);
	}
}
