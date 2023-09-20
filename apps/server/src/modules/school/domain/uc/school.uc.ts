import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { School } from '../school';
import { SchoolService } from '../service/school.service';

@Injectable()
export class SchoolUc {
	constructor(private readonly schoolService: SchoolService) {}

	public async getAllSchools(): Promise<School[]> {
		const schools = await this.schoolService.getAllSchools();

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const school = await this.schoolService.getSchool(schoolId);

		return school;
	}
}
