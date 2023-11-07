import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPagination, SortOrder } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolConfig } from '../../school.config';
import { School } from '../do';
import { SchoolRepo, SCHOOL_REPO } from '../interface';
import { SchoolQuery } from '../query';
import { SchoolFeature } from '../type';

@Injectable()
export class SchoolService {
	constructor(
		@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo,
		private readonly configService: ConfigService<SchoolConfig, true>
	) {}

	// TODO: Rename this to getSchools because it has a query and does not return all schools!
	public async getAllSchools(query: SchoolQuery, pagination?: IPagination): Promise<School[]> {
		const order = { name: SortOrder.asc };
		const schools = await this.schoolRepo.getAllSchools(query, { pagination, order });

		schools.forEach((school) => this.setStudentTeamCreationFeature(school));

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const school = await this.schoolRepo.getSchool(schoolId);

		this.setStudentTeamCreationFeature(school);

		return school;
	}

	private setStudentTeamCreationFeature(school: School): School {
		const configValue = this.configService.get<string>('STUDENT_TEAM_CREATION');

		if (configValue === 'enabled') {
			school.addFeature(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		} else if (configValue === 'disabled') {
			school.removeFeature(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		} else {
			// leave it as it is configured for the specific school
		}

		return school;
	}
}
