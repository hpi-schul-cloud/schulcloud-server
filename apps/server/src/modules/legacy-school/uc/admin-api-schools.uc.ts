import { Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { LegacySchoolService } from '../service';

@Injectable()
export class AdminApiSchoolUc {
	constructor(private readonly schoolService: LegacySchoolService) {}

	public async createSchool(props: { name: string; federalStateName: string }): Promise<LegacySchoolDo> {
		const school = await this.schoolService.createSchool(props);
		return school;
	}
}
