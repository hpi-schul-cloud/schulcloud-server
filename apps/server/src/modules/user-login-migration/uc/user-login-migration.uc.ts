import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, UserLoginMigrationDO } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { PageTypes } from '../interface/page-types.enum';
import { UserLoginMigrationService, UserMigrationService } from '../service';
import { PageContentDto } from '../service/dto/page-content.dto';
import { UserLoginMigrationQuery } from './dto/user-login-migration-query';

@Injectable()
export class UserLoginMigrationUc {
	constructor(
		private readonly userMigrationService: UserMigrationService,
		private readonly userLoginMigrationService: UserLoginMigrationService
	) {}

	async getPageContent(pageType: PageTypes, sourceSystem: string, targetSystem: string): Promise<PageContentDto> {
		const content: PageContentDto = await this.userMigrationService.getPageContent(
			pageType,
			sourceSystem,
			targetSystem
		);

		return content;
	}

	async getMigrations(
		userId: EntityId,
		query: UserLoginMigrationQuery,
		options: IFindOptions<UserLoginMigrationDO>
	): Promise<Page<UserLoginMigrationDO>> {
		if (userId !== query.userId) {
			throw new ForbiddenException('Accessing migration status of another user is forbidden.');
		}

		const userLoginMigrations: Page<UserLoginMigrationDO> =
			await this.userLoginMigrationService.findUserLoginMigrations(query, options);
		return userLoginMigrations;
	}
}
