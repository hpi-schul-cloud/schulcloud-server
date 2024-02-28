import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFindOptions } from '@shared/domain/interface/find-options';
import { SchoolFeature } from '@shared/domain/types';
import { EntityId } from '@shared/domain/types/entity-id';
import { System, SystemService } from '@src/modules/system';
import { SchoolConfig } from '../../school.config';
import { School, SchoolProps, SystemForLdapLogin } from '../do';
import { SchoolForLdapLogin, SchoolForLdapLoginProps } from '../do/school-for-ldap-login';
import { SchoolFactory } from '../factory';
import { SCHOOL_REPO, SchoolRepo, SchoolUpdateBody } from '../interface';
import { SchoolQuery } from '../query';

@Injectable()
export class SchoolService {
	constructor(
		@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo,
		private readonly systemService: SystemService,
		private readonly configService: ConfigService<SchoolConfig, true>
	) {}

	public async getSchoolById(schoolId: EntityId): Promise<School> {
		const school = await this.schoolRepo.getSchoolById(schoolId);

		this.addInstanceFeatures(school);

		return school;
	}

	public async getSchools(query: SchoolQuery = {}, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const schools = await this.schoolRepo.getSchools(query, options);

		schools.forEach((school) => this.addInstanceFeatures(school));

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

	public async getSchoolsForLdapLogin(): Promise<SchoolForLdapLogin[]> {
		const ldapLoginSystems = await this.systemService.findAllForLdapLogin();
		const ldapLoginSystemsIds = ldapLoginSystems.map((system) => system.id);

		const schoolsWithLdapLoginSystems = await this.schoolRepo.getSchoolsBySystemIds(ldapLoginSystemsIds);

		const schoolsForLdapLogin = schoolsWithLdapLoginSystems.map((school) =>
			this.mapToSchoolForLdapLogin(school, ldapLoginSystems)
		);

		return schoolsForLdapLogin;
	}

	public async updateSchool(schoolId: string, body: SchoolUpdateBody) {
		const school = await this.schoolRepo.getSchoolById(schoolId);

		const fullSchoolObject = SchoolFactory.buildFromPartialBody(school, body);
		this.removeInstanceFeatures(fullSchoolObject);

		const updatedSchool = await this.schoolRepo.save(fullSchoolObject);
		this.addInstanceFeatures(updatedSchool);

		return updatedSchool;
	}

	private mapToSchoolForLdapLogin(school: School, ldapLoginSystems: System[]): SchoolForLdapLogin {
		const schoolProps = school.getProps();

		const schoolForLdapLoginProps: SchoolForLdapLoginProps = {
			id: school.id,
			name: schoolProps.name,
			systems: [],
		};

		this.addLdapLoginSystems(schoolProps, ldapLoginSystems, schoolForLdapLoginProps);

		return new SchoolForLdapLogin(schoolForLdapLoginProps);
	}

	private addLdapLoginSystems(
		schoolProps: SchoolProps,
		ldapLoginSystems: System[],
		schoolForLdapLoginProps: SchoolForLdapLoginProps
	): void {
		schoolProps.systemIds?.forEach((systemIdInSchool) => {
			const relatedSystem = ldapLoginSystems.find((system) => system.id === systemIdInSchool);

			if (relatedSystem) {
				const relatedSystemProps = relatedSystem.getProps();

				const systemForLdapLogin = new SystemForLdapLogin({
					id: relatedSystemProps.id,
					type: relatedSystemProps.type,
					alias: relatedSystemProps.alias,
				});

				schoolForLdapLoginProps.systems.push(systemForLdapLogin);
			}
		});
	}

	// TODO: The logic for setting this feature should better be part of the creation of a school object.
	// But it has to be discussed, how to implement that. Thus we leave the logic here for now.
	private addInstanceFeatures(school: School): School {
		if (this.canStudentCreateTeam(school)) {
			school.addFeature(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		}

		return school;
	}

	private removeInstanceFeatures(school: School): School {
		if (this.canStudentCreateTeam(school)) {
			school.removeFeature(SchoolFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		}

		return school;
	}

	private canStudentCreateTeam(school: School): boolean {
		const configValue = this.configService.get<string>('STUDENT_TEAM_CREATION');
		const { enableStudentTeamCreation } = school.getProps();

		return (
			configValue === 'enabled' ||
			(configValue === 'opt-in' && enableStudentTeamCreation) ||
			// It is necessary to check enableStudentTeamCreation to be not false here,
			// because it being undefined means that the school has not opted out yet.
			(configValue === 'opt-out' && enableStudentTeamCreation !== false)
		);
	}
}
