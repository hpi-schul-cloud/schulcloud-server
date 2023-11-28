import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';

@Injectable()
export class SystemRule implements Rule<System> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, domainObject: System): boolean {
		const isMatched: boolean = domainObject instanceof System;

		return isMatched;
	}

	public hasPermission(user: User, domainObject: System, context: AuthorizationContext): boolean {
		const hasPermissions: boolean = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const hasAccess: boolean = user.school.systems.getIdentifiers().includes(domainObject.id);

		let isAuthorized: boolean = hasPermissions && hasAccess;

		if (context.action === Action.write) {
			isAuthorized = isAuthorized && this.canEdit(domainObject);
		}

		return isAuthorized;
	}

	public canEdit(system: unknown): boolean {
		const canEdit: boolean =
			typeof system === 'object' &&
			!!system &&
			'ldapConfig' in system &&
			typeof system.ldapConfig === 'object' &&
			!!system.ldapConfig &&
			'provider' in system.ldapConfig &&
			system.ldapConfig.provider === 'general';

		return canEdit;
	}
}
