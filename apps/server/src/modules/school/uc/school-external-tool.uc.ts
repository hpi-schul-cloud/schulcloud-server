import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolExternalToolService } from '../../tool/service/school-external-tool.service';

@Injectable()
export class SchoolExternalToolUc {
	constructor(private readonly schoolExternalToolService: SchoolExternalToolService) {}

	async getSchoolExternalTool(schoolId: string, toolId: string): Promise<SchoolExternalToolDO> {
		return this.schoolExternalToolService.getSchoolExternalToolById(toolId);
	}
}
