import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@core/logger';
import { EntityId } from '@shared/domain/types';
import { CommonCartridgeExportService, CommonCartridgeImportService } from '../service';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { ICurrentUser } from '@infra/auth-guard';

@Injectable()
export class CommonCartridgeUc {
	constructor(
		private readonly logger: LegacyLogger,
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
		this.logger.log(CommonCartridgeUc.name + `: CC file zipped...`);
		return exportedCourse;
	}

	public async importCourse(file: Buffer, currentUser: ICurrentUser): Promise<void> {
		await this.importService.importFile(file, currentUser);
	}
}
