import { FederalStateService, SchoolYearService } from '@modules/legacy-school';
import { School, SchoolService } from '@modules/school';
import { System, SystemService, SystemType } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { UserSourceOptions } from '@shared/domain/domainobject/user-source-options.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { Account, AccountService } from '@src/modules/account';
import { FederalStateNames } from '@src/modules/legacy-school/types';
import { FederalState, FileStorageType } from '@src/modules/school/domain';
import { SchoolFactory } from '@src/modules/school/domain/factory';
import { SchoolPermissions } from '@src/modules/school/domain/type';
import { FederalStateEntityMapper, SchoolYearEntityMapper } from '@src/modules/school/repo/mikro-orm/mapper';
import { UserService } from '@src/modules/user';
import { ObjectId } from 'bson';
import { TspSystemNotFoundLoggableException } from './loggable/tsp-system-not-found.loggable-exception';

@Injectable()
export class TspSyncService {
	private federalState: FederalState | undefined;

	constructor(
		private readonly systemService: SystemService,
		private readonly schoolService: SchoolService,
		private readonly federalStateService: FederalStateService,
		private readonly schoolYearService: SchoolYearService,
		private readonly userService: UserService,
		private readonly accountService: AccountService
	) {}

	public async findTspSystemOrFail(): Promise<System> {
		const systems = (
			await this.systemService.find({
				types: [SystemType.OAUTH, SystemType.OIDC],
			})
		).filter((system) => system.provisioningStrategy === SystemProvisioningStrategy.TSP);

		if (systems.length === 0) {
			throw new TspSystemNotFoundLoggableException();
		}

		return systems[0];
	}

	public async findSchool(system: System, identifier: string): Promise<School | undefined> {
		const schools = await this.schoolService.getSchools({
			externalId: identifier,
			systemId: system.id,
		});

		if (schools.length === 0) {
			return undefined;
		}
		return schools[0];
	}

	public async findSchoolsForSystem(system: System): Promise<School[]> {
		const schools = await this.schoolService.getSchools({
			systemId: system.id,
		});

		return schools;
	}

	public async updateSchool(school: School, name?: string): Promise<School> {
		if (!name) {
			return school;
		}

		school.name = name;

		const updatedSchool = await this.schoolService.save(school);

		return updatedSchool;
	}

	public async createSchool(system: System, identifier: string, name: string): Promise<School> {
		const schoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
		const schoolYear = SchoolYearEntityMapper.mapToDo(schoolYearEntity);
		const federalState = await this.findFederalState();

		const permissions: SchoolPermissions = {
			teacher: {
				STUDENT_LIST: true,
			},
		};

		const school = SchoolFactory.build({
			externalId: identifier,
			name,
			systemIds: [system.id],
			federalState,
			currentYear: schoolYear,
			features: new Set([SchoolFeature.OAUTH_PROVISIONING_ENABLED]),
			createdAt: new Date(),
			updatedAt: new Date(),
			id: new ObjectId().toHexString(),
			fileStorageType: FileStorageType.AWS_S3,
			permissions,
		});

		const savedSchool = await this.schoolService.save(school);

		return savedSchool;
	}

	private async findFederalState(): Promise<FederalState> {
		if (this.federalState) {
			return this.federalState;
		}

		const federalStateEntity = await this.federalStateService.findFederalStateByName(FederalStateNames.THUERINGEN);
		this.federalState = FederalStateEntityMapper.mapToDo(federalStateEntity);
		return this.federalState;
	}

	public async findUserByTspUid(tspUid: string): Promise<UserDO | null> {
		const tspUser = await this.userService.findUsers({ tspUid });

		if (tspUser.data.length === 0) {
			return null;
		}

		return tspUser.data[0];
	}

	public async findAccountByExternalId(externalId: string, systemId: EntityId): Promise<Account | null> {
		const user = await this.userService.findByExternalId(externalId, systemId);

		if (!user || !user.id) {
			return null;
		}

		const account = await this.accountService.findByUserId(user.id);

		return account;
	}

	public async updateUser(
		user: UserDO,
		email: string,
		externalId: string,
		previousExternalId: string
	): Promise<UserDO> {
		user.email = email;
		user.externalId = externalId;
		user.previousExternalId = previousExternalId;
		user.sourceOptions = new UserSourceOptions({ tspUid: user.externalId });

		return this.userService.save(user);
	}

	public async updateAccount(account: Account, username: string, systemId: string): Promise<Account> {
		account.username = username;
		account.systemId = systemId;

		return this.accountService.save(account);
	}
}
