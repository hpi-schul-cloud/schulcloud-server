import { Account, AccountService } from '@modules/account';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IResult } from 'ua-parser-js';
import { HelpdeskService, UserContext, UserDevice } from '../domain';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from '../helpdesk-config';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';

@Injectable()
export class HelpdeskUc {
	constructor(
		private readonly helpdeskProblemService: HelpdeskService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly accountService: AccountService,
		@Inject(HELPDESK_CONFIG_TOKEN) private readonly config: HelpdeskConfig
	) {}

	public async createHelpdeskProblem(
		userId: EntityId,
		params: HelpdeskProblemCreateParams,
		files?: Express.Multer.File[],
		userAgent?: IResult
	): Promise<void> {
		const { user, school } = await this.authorizeUserForSchool(userId);

		const account = await this.accountService.findByUserIdOrFail(userId);
		const userContext = this.createUserContext(user, school, account);
		const userDevice = this.createUserDevice(userAgent);

		await this.helpdeskProblemService.createProblem(params, userContext, userDevice, files);
	}

	public async createHelpdeskWish(
		userId: EntityId,
		params: HelpdeskWishCreateParams,
		files?: Express.Multer.File[],
		userAgent?: IResult
	): Promise<void> {
		const { user, school } = await this.authorizeUserForSchool(userId);

		const account = await this.accountService.findByUserIdOrFail(userId);
		const userContext = this.createUserContext(user, school, account);
		const userDevice = this.createUserDevice(userAgent);

		await this.helpdeskProblemService.createWish(params, userContext, userDevice, files);
	}

	private async authorizeUserForSchool(userId: EntityId): Promise<{ user: User; school: School }> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(user.school.id);

		this.authorizationService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.read([Permission.HELPDESK_CREATE])
		);

		return {
			user,
			school,
		};
	}

	private createUserContext(user: User, school: School, account: Account): UserContext {
		const userContext = new UserContext({
			userId: user.id,
			userName: account.username,
			userEmail: user.email,
			userRoles: user.roles?.getItems()?.map((role) => role.name),
			schoolId: school.id,
			schoolName: school.getProps().name,
			instanceName: this.config.instanceName,
		});

		return userContext;
	}

	private createUserDevice(userAgent?: IResult): UserDevice {
		const userDevice = new UserDevice({
			deviceUserAgent: userAgent?.ua,
			browserName: userAgent?.browser.name,
			browserVersion: userAgent?.browser.version,
			os: userAgent?.os.name,
		});

		return userDevice;
	}
}
