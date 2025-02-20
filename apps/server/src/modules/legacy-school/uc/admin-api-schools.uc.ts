import { Injectable } from '@nestjs/common';
import { LegacySchoolService } from '../service';
import { LegacySchoolDo } from '../domain';

@Injectable()
export class AdminApiSchoolUc {
	constructor(private readonly schoolService: LegacySchoolService) {}

	public async createSchool(props: { name: string; federalStateName: string }): Promise<LegacySchoolDo> {
		const school = await this.schoolService.createSchool(props);
		return school;
	}
}
