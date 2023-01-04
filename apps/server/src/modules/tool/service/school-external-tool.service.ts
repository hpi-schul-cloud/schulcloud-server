import { Injectable } from '@nestjs/common';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';

@Injectable()
export class SchoolExternalToolService {
	constructor(private readonly schoolExternalToolRepo: SchoolExternalToolRepo) {}

	async findSchoolExternalTools(query: Partial<SchoolExternalToolDO>): Promise<SchoolExternalToolDO[]> {
		const schoolExternalToolDOS: SchoolExternalToolDO[] = await this.schoolExternalToolRepo.find(query);
		return schoolExternalToolDOS;
	}
}
