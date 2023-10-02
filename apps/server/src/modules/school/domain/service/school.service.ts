import { Inject, Injectable } from '@nestjs/common';
import { EntityId, IPagination, SortOrder } from '@shared/domain';
import { SchoolRepo, SCHOOL_REPO } from '../interface';
import { School } from '../do';
import { SchoolQuery } from '../type';

@Injectable()
export class SchoolService {
	constructor(@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo) {}

	public async getAllSchools(query: SchoolQuery, pagination: IPagination): Promise<School[]> {
		// TODO: Is this really the right place to apply the default sort order?
		const order = { name: SortOrder.asc };
		const schools = await this.schoolRepo.getAllSchools(query, { pagination, order });

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const school = await this.schoolRepo.getSchool(schoolId);

		return school;
	}
}
