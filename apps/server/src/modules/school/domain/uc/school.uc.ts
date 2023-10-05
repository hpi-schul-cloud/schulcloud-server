import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { School } from '../do';
import { SchoolService } from '../service';
import { SchoolQuery } from '../type';

@Injectable()
export class SchoolUc {
	constructor(private readonly schoolService: SchoolService) {}

	public async getAllSchools(query: SchoolQuery, pagination: IPagination): Promise<School[]> {
		const schools = await this.schoolService.getAllSchools(query, pagination);

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const school = await this.schoolService.getSchool(schoolId);

		return school;
	}
}
