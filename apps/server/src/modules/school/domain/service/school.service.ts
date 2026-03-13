import { System, SystemService } from '@modules/system';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { IFindOptions } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { SCHOOL_CONFIG_TOKEN, SchoolConfig, StudentTeamCreationOption } from '../../school.config';
import { School, SchoolProps, SchoolYear, SystemForLdapLogin } from '../do';
import { SchoolForLdapLogin, SchoolForLdapLoginProps } from '../do/school-for-ldap-login';
import { SchoolFactory } from '../factory';
import { SCHOOL_REPO, SchoolRepo, SchoolUpdateBody } from '../interface';
import {
	SchoolHasNoSystemLoggableException,
	SystemCanNotBeDeletedLoggableException,
	SystemNotFoundLoggableException,
} from '../loggable';
import { SchoolQuery } from '../query';
import { InstanceFeature } from '../type';

@Injectable()
export class SchoolService {
	constructor(
		@Inject(SCHOOL_REPO) private readonly schoolRepo: SchoolRepo,
		private readonly systemService: SystemService,
		@Inject(SCHOOL_CONFIG_TOKEN) private readonly config: SchoolConfig
	) {}

	public async getSchoolById(schoolId: EntityId): Promise<School> {
		let school = await this.schoolRepo.getSchoolById(schoolId);

		school = this.addInstanceFeatures(school);

		return school;
	}

	public async getSchoolsByIds(schoolIds: EntityId[]): Promise<School[]> {
		const entities = await this.schoolRepo.getSchoolsByIds(schoolIds);
		const schools = entities.map((entity) => this.addInstanceFeatures(entity));

		return schools;
	}

	public async getSchoolByOfficialSchoolNumber(officialSchoolNumber: string): Promise<School | null> {
		const school: School | null = await this.schoolRepo.getSchoolByOfficialSchoolNumber(officialSchoolNumber);

		return school;
	}

	public async getSchools(query: SchoolQuery = {}, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		let schools = await this.schoolRepo.getSchools(query, options);

		schools = schools.map((school) => this.addInstanceFeatures(school));

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

	public async getSchoolList(
		options: IFindOptions<SchoolProps> = {},
		federalStateId?: EntityId
	): Promise<{ schools: School[]; count: number }> {
		const { schools, count } = await this.getExternalSchools(options, federalStateId);

		return { schools, count };
	}

	private async getExternalSchools(
		options: IFindOptions<SchoolProps> = {},
		federalStateId?: EntityId
	): Promise<{ schools: School[]; count: number }> {
		const result = await this.schoolRepo.getSchoolList(options, federalStateId);

		const schools = result.schools.map((school) => this.addInstanceFeatures(school));

		return { schools, count: result.count };
	}

	public async getCurrentYear(schoolId: EntityId): Promise<SchoolYear | undefined> {
		const school = await this.getSchoolById(schoolId);
		return school.currentYear;
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

	public async getSchoolSystems(school: School): Promise<System[]> {
		const { systemIds } = school.getProps();

		let schoolSystems: System[] = [];

		if (TypeGuard.isArrayWithElements(systemIds)) {
			schoolSystems = await this.systemService.getSystems(systemIds);
		}

		return schoolSystems;
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

	public async getAllSchoolIds(): Promise<EntityId[]> {
		const schoolIds = await this.schoolRepo.getAllSchoolIds();

		return schoolIds;
	}

	public async updateSchool(school: School, body: SchoolUpdateBody): Promise<School> {
		const fullSchoolObject = SchoolFactory.buildFromPartialBody(school, body);

		let updatedSchool = await this.schoolRepo.save(fullSchoolObject);
		updatedSchool = this.addInstanceFeatures(updatedSchool);

		return updatedSchool;
	}

	public async save(school: School): Promise<School> {
		const updatedSchool: School = await this.schoolRepo.save(school);

		return updatedSchool;
	}

	public async removeSystemFromSchool(school: School, systemId: EntityId): Promise<void> {
		if (!school.hasSystem(systemId)) {
			throw new SchoolHasNoSystemLoggableException(school.id, systemId);
		}

		const system = await this.tryFindAndRemoveSystem(systemId);

		school.removeSystem(system.id);

		await this.schoolRepo.save(school);
	}

	private async tryFindAndRemoveSystem(systemId: string): Promise<System> {
		const system = await this.systemService.findById(systemId);
		if (!system) {
			throw new SystemNotFoundLoggableException(systemId);
		}

		if (system.isDeletable()) {
			await this.systemService.delete(system);
		} else {
			throw new SystemCanNotBeDeletedLoggableException(systemId);
		}

		return system;
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
			school.addInstanceFeature(InstanceFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED);
		}

		return school;
	}

	private canStudentCreateTeam(school: School): boolean {
		const configValue = this.config.studentTeamCreation;
		const { enableStudentTeamCreation } = school.getProps();

		return (
			configValue === StudentTeamCreationOption.ENABLED ||
			(configValue === StudentTeamCreationOption.OPT_IN && enableStudentTeamCreation) ||
			// It is necessary to check enableStudentTeamCreation to be not false here,
			// because it being undefined means that the school has not opted out yet.
			(configValue === StudentTeamCreationOption.OPT_OUT && enableStudentTeamCreation !== false)
		);
	}

	public async hasLdapSystem(schoolId: EntityId): Promise<boolean> {
		const hasLdapSystem: boolean = await this.schoolRepo.hasLdapSystem(schoolId);

		return hasLdapSystem;
	}
}
