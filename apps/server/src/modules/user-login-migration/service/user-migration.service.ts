import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { UserLoginMigrationDO } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { LegacyLogger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { LegacySchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { EntityId, SystemTypeEnum } from '@src/shared/domain/types';
import { PageTypes } from '../interface/page-types.enum';
import { MigrationDto } from './dto/migration.dto';
import { PageContentDto } from './dto/page-content.dto';

@Injectable()
/**
 * @deprecated
 */
export class UserMigrationService {
	private readonly hostUrl: string;

	private readonly publicBackendUrl: string;

	private readonly dashboardUrl: string = '/dashboard';

	private readonly logoutUrl: string = '/logout';

	private readonly loginUrl: string = '/login';

	constructor(
		private readonly schoolService: LegacySchoolService,
		private readonly systemService: SystemService,
		private readonly userService: UserService,
		private readonly logger: LegacyLogger,
		private readonly accountService: AccountService,
		private readonly userLoginMigrationRepo: UserLoginMigrationRepo
	) {
		this.hostUrl = Configuration.get('HOST') as string;
		this.publicBackendUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
	}

	async getMigrationConsentPageRedirect(officialSchoolNumber: string, originSystemId: string): Promise<string> {
		const school: SchoolDO | null = await this.schoolService.getSchoolBySchoolNumber(officialSchoolNumber);

		if (!school || !school.id) {
			throw new NotFoundException(`School with offical school number ${officialSchoolNumber} does not exist.`);
		}

		const userLoginMigration: UserLoginMigrationDO | null = await this.userLoginMigrationRepo.findBySchoolId(school.id);

		const oauthSystems: SystemDto[] = await this.systemService.findByType(SystemTypeEnum.OAUTH);
		const sanisSystem: SystemDto | undefined = oauthSystems.find(
			(system: SystemDto): boolean => system.alias === 'SANIS'
		);
		const iservSystem: SystemDto | undefined = oauthSystems.find(
			(system: SystemDto): boolean => system.alias === 'Schulserver'
		);

		if (!iservSystem?.id || !sanisSystem?.id) {
			throw new InternalServerErrorException(
				'Unable to generate migration redirect url. Iserv or Sanis system information is invalid.'
			);
		}

		const url = new URL('/migration', this.hostUrl);
		url.searchParams.append('sourceSystem', iservSystem.id);
		url.searchParams.append('targetSystem', sanisSystem.id);
		url.searchParams.append('origin', originSystemId);
		url.searchParams.append('mandatory', (!!userLoginMigration?.mandatorySince).toString());
		return url.toString();
	}

	async getPageContent(pageType: PageTypes, sourceId: string, targetId: string): Promise<PageContentDto> {
		const sourceSystem: SystemDto = await this.systemService.findById(sourceId);
		const targetSystem: SystemDto = await this.systemService.findById(targetId);

		const targetSystemLoginUrl: string = this.getLoginUrl(targetSystem);

		switch (pageType) {
			case PageTypes.START_FROM_TARGET_SYSTEM: {
				const sourceSystemLoginUrl: string = this.getLoginUrl(sourceSystem, targetSystemLoginUrl.toString());

				const content: PageContentDto = new PageContentDto({
					proceedButtonUrl: sourceSystemLoginUrl.toString(),
					cancelButtonUrl: this.loginUrl,
				});
				return content;
			}
			case PageTypes.START_FROM_SOURCE_SYSTEM: {
				const content: PageContentDto = new PageContentDto({
					proceedButtonUrl: targetSystemLoginUrl.toString(),
					cancelButtonUrl: this.dashboardUrl,
				});
				return content;
			}
			case PageTypes.START_FROM_SOURCE_SYSTEM_MANDATORY: {
				const content: PageContentDto = new PageContentDto({
					proceedButtonUrl: targetSystemLoginUrl.toString(),
					cancelButtonUrl: this.logoutUrl,
				});
				return content;
			}
			default: {
				throw new BadRequestException('Unknown PageType requested');
			}
		}
	}

	// TODO: https://ticketsystem.dbildungscloud.de/browse/N21-632 Move Redirect Logic URLs to Client
	getMigrationRedirectUri(): string {
		const combinedUri = new URL(this.publicBackendUrl);
		combinedUri.pathname = `api/v3/sso/oauth/migration`;
		return combinedUri.toString();
	}

	async migrateUser(currentUserId: string, externalUserId: string, targetSystemId: string): Promise<MigrationDto> {
		const userDO: UserDO = await this.userService.findById(currentUserId);
		const account: AccountDto = await this.accountService.findByUserIdOrFail(currentUserId);
		const userDOCopy: UserDO = new UserDO({ ...userDO });
		const accountCopy: AccountDto = new AccountDto({ ...account });

		let migrationDto: MigrationDto;
		try {
			migrationDto = await this.doMigration(userDO, externalUserId, account, targetSystemId, accountCopy.systemId);
		} catch (e: unknown) {
			this.logger.log({
				message: 'This error occurred during migration of User:',
				affectedUserId: currentUserId,
				error: e,
			});

			migrationDto = await this.rollbackMigration(userDOCopy, accountCopy, targetSystemId);
		}

		return migrationDto;
	}

	private async rollbackMigration(
		userDOCopy: UserDO,
		accountCopy: AccountDto,
		targetSystemId: string
	): Promise<MigrationDto> {
		await this.userService.save(userDOCopy);
		await this.accountService.save(accountCopy);

		const userMigrationDto: MigrationDto = this.createUserMigrationDto(
			'/migration/error',
			accountCopy.systemId ?? '',
			targetSystemId
		);
		return userMigrationDto;
	}

	private async doMigration(
		userDO: UserDO,
		externalUserId: string,
		account: AccountDto,
		targetSystemId: string,
		accountId?: EntityId
	): Promise<MigrationDto> {
		userDO.previousExternalId = userDO.externalId;
		userDO.externalId = externalUserId;
		userDO.lastLoginSystemChange = new Date();
		await this.userService.save(userDO);

		account.systemId = targetSystemId;
		await this.accountService.save(account);

		const userMigrationDto: MigrationDto = this.createUserMigrationDto(
			'/migration/success',
			accountId ?? '',
			targetSystemId
		);
		return userMigrationDto;
	}

	// TODO: https://ticketsystem.dbildungscloud.de/browse/N21-632 Move Redirect Logic URLs to Client
	private createUserMigrationDto(urlPath: string, sourceSystemId: string, targetSystemId: string) {
		const errorUrl: URL = new URL(urlPath, this.hostUrl);
		errorUrl.searchParams.append('sourceSystem', sourceSystemId);
		errorUrl.searchParams.append('targetSystem', targetSystemId);
		const userMigrationDto: MigrationDto = new MigrationDto({
			redirect: errorUrl.toString(),
		});
		return userMigrationDto;
	}

	private getLoginUrl(system: SystemDto, postLoginRedirect?: string): string {
		if (!system.oauthConfig || !system.id) {
			throw new UnprocessableEntityException(`System ${system?.id || 'unknown'} has no oauth config`);
		}

		const loginUrl: URL = new URL(`api/v3/sso/login/${system.id}`, this.publicBackendUrl);
		if (postLoginRedirect) {
			loginUrl.searchParams.append('postLoginRedirect', postLoginRedirect);
		} else {
			loginUrl.searchParams.append('migration', 'true');
		}

		return loginUrl.toString();
	}
}
