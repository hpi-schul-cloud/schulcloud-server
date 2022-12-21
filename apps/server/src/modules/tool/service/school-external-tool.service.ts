import { Injectable } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';

@Injectable()
export class SchoolExternalToolService {
	constructor(private readonly schoolExternalToolRepo: SchoolExternalToolRepo) {}

	async getSchoolExternalToolById(toolId: string): Promise<SchoolExternalToolDO> {
		const tool: SchoolExternalToolDO = await this.schoolExternalToolRepo.findById(toolId);
		return tool;
	}
}
