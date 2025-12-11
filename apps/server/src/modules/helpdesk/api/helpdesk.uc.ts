import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolService } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { IResult } from 'ua-parser-js';
import { HelpdeskDevice, HelpdeskSystem } from '../domain';
import { HelpdeskProblemService } from '../domain/service';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';

@Injectable()
export class HelpdeskUc {
	constructor(
		private readonly helpdeskProblemService: HelpdeskProblemService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	public async createHelpdeskMessage(
		userId: EntityId,
		params: HelpdeskProblemCreateParams | HelpdeskWishCreateParams,
		files?: Express.Multer.File[],
		userAgent?: IResult
	): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(user.school.id);

		this.authorizationService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.read([Permission.HELPDESK_CREATE])
		);

		const systemProps = new HelpdeskSystem({
			userId: user.id,
			userName: `${user.firstName} ${user.lastName}`,
			userEmail: user.email || '',
			userRoles: user.roles?.getItems()?.map((role) => role.name),
			schoolId: school.id,
			schoolName: school.getProps().name,
		});

		const userDeviceProps = new HelpdeskDevice({
			deviceUserAgent: userAgent?.ua || '',
			browserName: userAgent?.browser.name || '',
			browserVersion: userAgent?.browser.version || '',
			os: userAgent?.os.name || '',
		});

		if (params.supportType === 'problem' && params instanceof HelpdeskProblemCreateParams) {
			await this.helpdeskProblemService.createProblem(params, systemProps, userDeviceProps, files);
		} else if (params.supportType === 'wish' && params instanceof HelpdeskWishCreateParams) {
			await this.helpdeskProblemService.createWish(params, systemProps, userDeviceProps, files);
		} else {
			throw new Error('Invalid support type');
		}
	}
}
