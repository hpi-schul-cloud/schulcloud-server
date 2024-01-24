import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFindOptions } from '@shared/domain/interface/find-options';
import { SchoolFeature } from '@shared/domain/types';
import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolConfig } from '../../school.config';
import { School, SchoolProps } from '../do';
import { SchoolRepo, SCHOOL_REPO } from '../interface';
import { SchoolQuery } from '../query';

@Injectable()
export class SchoolService {
	constructor(
		@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo,
		private readonly configService: ConfigService<SchoolConfig, true>
	) {}

	public async getSchoolById(schoolId: EntityId): Promise<School> {
		const school = await this.schoolRepo.getSchoolById(schoolId);

		this.setStudentTeamCreationFeature(school);

		return school;
	}

	public async getSchools(query: SchoolQuery = {}, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const schools = await this.schoolRepo.getSchools(query, options);

		schools.forEach((school) => this.setStudentTeamCreationFeature(school));

		return schools;
	}

	public async getSchoolsForExternalInvite(
		query: SchoolQuery,
		ownSchoolId: EntityId,
		options?: IFindOptions<SchoolProps>
	): Promise<School[]> {
		const schools = await this.getSchools(query, options);

		const schoolsForExternalInvite = schools.filter((school) => school.isEligibleForExternalInvite(ownSchoolId));

		return schoolsForExternalInvite;
	}

	public async doesSchoolExist(schoolId: EntityId): Promise<boolean> {
		try {
			await this.schoolRepo.getSchoolById(schoolId);

			return true;
		} catch (error) {
			if (error instanceof NotFoundException) {
				return false;
			}

			throw error;
		}
	}

	public async getSchoolsForLdapLogin(): Promise<School[]> {
		const schools = await this.schoolRepo.getAllSchoolsWithActiveLdapSystems();

		return schools;
	}

	// TODO: The logic for setting this feature should better be part of the creation of a school object.
	// But it has to be discussed, how to implement that. Thus we leave the logic here for now.
	private setStudentTeamCreationFeature(school: School): School {
		const configValue = this.configService.get<string>('STUDENT_TEAM_CREATION');

		if (
			configValue === 'enabled' ||
			(configValue === 'opt-in' && school.getProps().enableStudentTeamCreation) ||
			// It is necessary to check enableStudentTeamCreation to be not false here,
			// because it being undefined means that the school has not opted out yet.
			(configValue === 'opt-out' && school.getProps().enableStudentTeamCreation !== false)
		) {
			school.addFeature(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		}

		return school;
	}
}
