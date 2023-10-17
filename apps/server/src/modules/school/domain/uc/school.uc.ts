import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { School } from '../do';
import { SlimSchoolDto } from '../dto/slim-school.dto';
import { SchoolMapper } from '../mapper';
import { SchoolService } from '../service';
import { SchoolQuery } from '../type';

@Injectable()
export class SchoolUc {
	constructor(private readonly schoolService: SchoolService) {}

	public async getListOfSlimSchools(query: SchoolQuery, pagination: IPagination): Promise<SlimSchoolDto[]> {
		const schools = await this.schoolService.getAllSchools(query, pagination);

		const dtos = SchoolMapper.mapToListOfSlimDtos(schools);

		return dtos;
	}

	public async getAllSchools(query: SchoolQuery, pagination: IPagination): Promise<School[]> {
		const schools = await this.schoolService.getAllSchools(query, pagination);

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const school = await this.schoolService.getSchool(schoolId);

		return school;
	}
}
