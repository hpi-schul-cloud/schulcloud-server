import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { SchoolExternalToolService } from '@src/modules/tool/service/school-external-tool.service';
import { Page } from '@shared/domain/interface/page';

@Injectable()
export class SchoolExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService
	) {}

	async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalToolDO[]> {
		const externalTools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools({});
		const toolsInUse: SchoolExternalToolDO[] = await this.schoolExternalToolService.findSchoolExternalToolsBySchoolId(
			schoolId
		);
		const toolIdsInUse: EntityId[] = toolsInUse.map(
			(schoolExternalTool: SchoolExternalToolDO): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalToolDO[] = externalTools.data.filter(
			(tool: ExternalToolDO): boolean => !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id)
		);
		return availableTools;
	}
}
