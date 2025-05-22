import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { UserDo } from '@modules/user';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserRule implements Rule<UserDo> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly configService: ConfigService,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof UserDo;

		return isMatched;
	}

	public hasPermission(user: User, entity: UserDo, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const isHimself = user.id === entity.id;
		const isUsersSchool = user.school.id === entity.schoolId;
		const isDiscoverable = this.determineDiscoverability(entity);

		const isVisible = isHimself || isUsersSchool || isDiscoverable;

		return hasPermission && isVisible;
	}

	private determineDiscoverability(entity: UserDo): boolean {
		const discoverabilitySetting = this.configService.get<string>('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION');
		if (discoverabilitySetting === 'disabled') {
			return false;
		}
		if (discoverabilitySetting === 'enabled') {
			return true;
		}

		if (discoverabilitySetting === 'opt-in') {
			return entity.discoverable ?? false;
		}
		if (discoverabilitySetting === 'opt-out') {
			return entity.discoverable ?? true;
		}

		throw new Error('Invalid discoverability setting');
	}
}
