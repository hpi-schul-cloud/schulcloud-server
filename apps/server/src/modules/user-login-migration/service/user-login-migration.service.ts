import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, IFindOptions, SystemTypeEnum, UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { UserLoginMigrationQuery } from '../uc/dto/user-login-migration-query';

@Injectable()
export class UserLoginMigrationService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: SchoolService,
		private readonly systemService: SystemService
	) {}

	// TODO: N21-822 after introduction of entity use repo instead of services
	async findUserLoginMigrations(
		query: UserLoginMigrationQuery,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		options: IFindOptions<UserLoginMigrationDO>
	): Promise<Page<UserLoginMigrationDO>> {
		const page = new Page<UserLoginMigrationDO>([], 0);

		if (query.userId) {
			const userDO: UserDO = await this.userService.findById(query.userId);
			const schoolDO: SchoolDO = await this.schoolService.getSchoolById(userDO.schoolId);

			if (schoolDO.oauthMigrationStart) {
				// TODO: N21-824 change logic with post migration endpoint
				const oauthSystems: SystemDto[] = await this.systemService.findByType(SystemTypeEnum.OAUTH);
				const sanisSystem: SystemDto | undefined = oauthSystems.find(
					(system: SystemDto): boolean => system.alias === 'SANIS'
				);

				if (!sanisSystem?.id) {
					throw new InternalServerErrorException('Cannot find Sanis system information.');
				}

				// TODO: N21-824 change logic with post migration endpoint
				const sourceSystemId: EntityId | undefined =
					schoolDO.systems && schoolDO.systems.length > 0 && schoolDO.systems[0] !== sanisSystem.id
						? schoolDO.systems[0]
						: undefined;

				const hasUserMigrated =
					userDO.lastLoginSystemChange && userDO.lastLoginSystemChange > schoolDO.oauthMigrationStart;

				if (!hasUserMigrated) {
					page.data = [
						new UserLoginMigrationDO({
							id: undefined,
							sourceSystemId,
							targetSystemId: sanisSystem.id,
							startedAt: schoolDO.oauthMigrationStart,
							closedAt: schoolDO.oauthMigrationFinished,
							finishedAt: schoolDO.oauthMigrationFinalFinish,
							mandatorySince: schoolDO.oauthMigrationMandatory,
						}),
					];
					page.total = 1;
				}
			}
		}

		return Promise.resolve(page);
	}
}
