import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { HelpdeskProblemService } from '../domain/service';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';

@Injectable()
export class HelpdeskUc {
	constructor(
		private readonly helpdeskProblemService: HelpdeskProblemService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	public async createHelpdeskProblem(userId: EntityId, data: HelpdeskProblemCreateParams): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const school = await this.schoolService.getSchoolById(user.school.id);
		// Check permissions
		this.authorizationService.checkPermission(
			user,
			school,
			AuthorizationContextBuilder.read([Permission.HELPDESK_CREATE])
		);

		// Add user and school info
		const createProps: any = {
			...data,
			userId: user.id,
			systemInformation: this.generateSystemInformation(user),
			schoolId: school.id,
			schoolName: school.name,
		};

		await this.helpdeskProblemService.createProblem(createProps);
	}

	public async createHelpdeskWish(userId: string, body: HelpdeskWishCreateParams) {
		throw new Error('Method not implemented.');
	}

	private generateSystemInformation(user: User): string {
		const roles: string[] = ['NO ROLE(S)']; //  user.roles.map((role: { name: string }) => role.name) ||
		const email = user.email || 'NO EMAIL';
		const username = `${user.firstName} ${user.lastName}` || 'NO USERNAME';

		return `
	User login: ${username}
	User role(s): ${roles.join(', ')}
	User registrated email: ${email}
		`;
	}
}
