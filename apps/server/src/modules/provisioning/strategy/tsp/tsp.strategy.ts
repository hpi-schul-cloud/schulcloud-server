import { AccountSave, AccountService } from '@modules/account';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { IdTokenExtractionFailureLoggableException } from '@src/modules/oauth/loggable';
import { validate } from 'class-validator';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { TspJwtPayload } from './tsp.jwt.payload';

@Injectable()
export class TspProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.TSP;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const decodedAccessToken: JwtPayload | null = jwt.decode(input.accessToken, { json: true });

		if (!decodedAccessToken || !decodedAccessToken.sub) {
			throw new IdTokenExtractionFailureLoggableException('sub');
		}

		const payload = new TspJwtPayload(decodedAccessToken);
		const errors = await validate(payload);

		if (errors.length > 0) {
			throw new IdTokenExtractionFailureLoggableException(errors.map((error) => error.property).join(', '));
		}

		/* example payload access token:
			"sub": "TSPUserId",
			 "resource_access": {
			"tis-ci-schulcloud-ad52150a5e48": {
			"roles": [
				"Lehrer",
				"Admin"
			]
			}
			},
			"sid": "8c3c84ba-65a7-4618-a444-4dfc977a7ba0", provisioning system id => strategy tsp
			"ptscListRolle": "Lehrer,Admin",
			"personVorname": "TSC",
			"ptscSchuleNummer": "11111",
			"personNachname": "Admin"
			"ptscListKlasseId": [...]
		 */

		const provisioningSystemDto = new ProvisioningSystemDto({
			systemId: payload.sid,
			provisioningStrategy: SystemProvisioningStrategy.TSP,
		});

		const externalUserDto = new ExternalUserDto({
			externalId: payload.sub,
			firstName: payload.personVorname,
			lastName: payload.personNachname,
			roles: Object.values(RoleName).filter((role) => payload.ptscListRolle.split(',').includes(role)),
		});

		const externalSchool = await this.schoolService.getSchoolById(payload.ptscSchuleNummer);
		const schoolName = externalSchool.getProps().name;
		const externalSchoolDto = new ExternalSchoolDto({
			externalId: payload.ptscSchuleNummer,
			name: schoolName,
		});

		const oauthDataDto = new OauthDataDto({
			system: provisioningSystemDto,
			externalUser: externalUserDto,
			externalSchool: externalSchoolDto,
			// TODO externalClass: ExternalClassDto , after merging EW-999
		});

		return oauthDataDto;
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		const school = await this.findSchoolOrFail(data);
		const user = await this.provisionUserAndAccount(data, school);

		// TODO EW-999: Create or update classes

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async findSchoolOrFail(data: OauthDataDto): Promise<School> {
		if (!data.externalSchool) {
			throw new UnprocessableEntityException(
				`Unable to create new external user ${data.externalUser.externalId} without a school`
			);
		}

		const school = await this.schoolService.getSchools({
			systemId: data.system.systemId,
			externalId: data.externalSchool.externalId,
		});

		if (!school || school.length === 0) {
			throw new NotFoundLoggableException(School.name, {
				systemId: data.system.systemId,
				externalId: data.externalSchool.externalId,
			});
		}

		return school[0];
	}

	private async provisionUserAndAccount(data: OauthDataDto, school: School): Promise<UserDO> {
		const existingUser = await this.userService.findByExternalId(data.externalUser.externalId, data.system.systemId);
		const roleRefs = await this.getRoleReferencesForUser(data.externalUser);

		let user: UserDO;
		if (existingUser) {
			// TODO EW-999: Check school change

			user = await this.updateUser(existingUser, data.externalUser, roleRefs, school.id);
		} else {
			user = await this.createUser(data.externalUser, roleRefs, school.id);
		}

		await this.ensureAccountExists(user, data.system.systemId);

		return user;
	}

	private async getRoleReferencesForUser(externalUser: ExternalUserDto): Promise<RoleReference[]> {
		const rolesDtos = await this.roleService.findByNames(externalUser.roles || []);
		const roleRefs = rolesDtos.map((role) => new RoleReference({ id: role.id || '', name: role.name }));

		return roleRefs;
	}

	private async updateUser(
		existingUser: UserDO,
		externalUser: ExternalUserDto,
		roleRefs: RoleReference[],
		schoolId: string
	): Promise<UserDO> {
		existingUser.roles = roleRefs;
		existingUser.schoolId = schoolId;
		existingUser.firstName = externalUser.firstName || existingUser.firstName;
		existingUser.lastName = externalUser.lastName || existingUser.lastName;
		existingUser.email = externalUser.email || existingUser.email;
		existingUser.birthday = externalUser.birthday;
		const updatedUser = await this.userService.save(existingUser);

		return updatedUser;
	}

	private async createUser(
		externalUser: ExternalUserDto,
		roleRefs: RoleReference[],
		schoolId: string
	): Promise<UserDO> {
		if (!externalUser.firstName || !externalUser.lastName || !externalUser.email) {
			throw new UnprocessableEntityException('Unable to create user without first name, last name or email');
		}

		const newUser = new UserDO({
			roles: roleRefs,
			schoolId,
			firstName: externalUser.firstName,
			lastName: externalUser.lastName,
			email: externalUser.email,
			birthday: externalUser.birthday,
		});
		const savedUser = await this.userService.save(newUser);

		return savedUser;
	}

	private async ensureAccountExists(user: UserDO, systemId: string): Promise<void> {
		if (!user.id) {
			throw new UnprocessableEntityException('Unable to create account for user which has no id');
		}

		const account = await this.accountService.findByUserId(user.id);

		if (!account) {
			await this.accountService.saveWithValidation(
				new AccountSave({
					userId: user.id,
					username: user.email,
					systemId,
					activated: true,
				})
			);
		} else {
			account.username = user.email;
			await this.accountService.saveWithValidation(account);
		}
	}
}
