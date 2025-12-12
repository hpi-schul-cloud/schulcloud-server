import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { School, SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IResult } from 'ua-parser-js';
import { HelpdeskDevice, HelpdeskService, HelpdeskSystem } from '../domain';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';

@Injectable()
export class HelpdeskUc {
	constructor(
		private readonly helpdeskProblemService: HelpdeskService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	public async createHelpdeskProblem(
		userId: EntityId,
		params: HelpdeskProblemCreateParams,
		files?: Express.Multer.File[],
		userAgent?: IResult
	): Promise<void> {
		const { user, school } = await this.authorizeUserForSchool(userId);

		const system = this.createSystem(user, school);
		const userDevice = this.createUserDevice(userAgent);

		await this.helpdeskProblemService.createProblem(params, system, userDevice, files);
	}

	public async createHelpdeskWish(
		userId: EntityId,
		params: HelpdeskWishCreateParams,
		files?: Express.Multer.File[],
		userAgent?: IResult
	): Promise<void> {
		const { user, school } = await this.authorizeUserForSchool(userId);

		const system = this.createSystem(user, school);
		const userDevice = this.createUserDevice(userAgent);

		await this.helpdeskProblemService.createWish(params, system, userDevice, files);
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

	private createSystem(user: User, school: School): HelpdeskSystem {
		const system = new HelpdeskSystem({
			userId: user.id,
			userName: `${user.firstName} ${user.lastName}`,
			userEmail: user.email || '',
			userRoles: user.roles?.getItems()?.map((role) => role.name),
			schoolId: school.id,
			schoolName: school.getProps().name,
		});

		return system;
	}

	private createUserDevice(userAgent?: IResult): HelpdeskDevice {
		const userDevice = new HelpdeskDevice({
			deviceUserAgent: userAgent?.ua || '',
			browserName: userAgent?.browser.name || '',
			browserVersion: userAgent?.browser.version || '',
			os: userAgent?.os.name || '',
		});

		return userDevice;
	}
}
