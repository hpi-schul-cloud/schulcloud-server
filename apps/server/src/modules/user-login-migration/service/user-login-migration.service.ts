import { Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject/page';
import { IFindOptions, UserLoginMigrationDO } from '@shared/domain';
import { UserService } from '@src/modules/user';
import { SchoolService } from '@src/modules/school';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserLoginMigrationQuery } from '../uc/dto/user-login-migration-query';

@Injectable()
export class UserLoginMigrationService {
	constructor(private readonly userService: UserService, private readonly schoolService: SchoolService) {}

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

			page.data.push(
				new UserLoginMigrationDO({
					id: undefined,
					// TODO: where we get source and target ids
					sourceSystemId: '',
					targetSystemId: '',
					startedAt: schoolDO.oauthMigrationStart,
					completedAt: schoolDO.oauthMigrationFinished,
					finishedAt: schoolDO.oauthMigrationFinalFinish,
					mandatorySince: schoolDO.oauthMigrationMandatory,
				})
			);
			page.total = page.data.length;
		}

		return Promise.resolve(page);
	}
}
