import { Injectable } from '@nestjs/common';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { EntityId } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';

@Injectable()
export class SchoolExternalToolService {
	constructor(private readonly schoolExternalToolRepo: SchoolExternalToolRepo) {}

	async findSchoolExternalToolsBySchoolId(schoolId: EntityId): Promise<SchoolExternalToolDO[]> {
		const schoolExternalTools: SchoolExternalToolDO[] = await this.schoolExternalToolRepo.findBySchoolId(schoolId);
		return schoolExternalTools;
	}
}
