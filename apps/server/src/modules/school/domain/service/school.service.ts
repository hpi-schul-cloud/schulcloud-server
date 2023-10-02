import { Inject, Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { SchoolRepo, SCHOOL_REPO } from '../interface';
import { School } from '../do';
import { SchoolQuery } from '../type';

@Injectable()
export class SchoolService {
	constructor(@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo) {}

	public async getAllSchools(query: SchoolQuery, pagination: IPagination): Promise<School[]> {
		const schools = await this.schoolRepo.getAllSchools(query, { pagination });

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const school = await this.schoolRepo.getSchool(schoolId);

		return school;
	}
}
