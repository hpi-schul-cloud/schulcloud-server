import { System } from '@modules/system';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';

@Injectable()
export class SystemRule implements Rule<System> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof System;

		return isMatched;
	}

	public hasPermission(user: User, object: System, context: AuthorizationContext): boolean {
		const hasPermissions: boolean = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const hasAccess: boolean = user.school.systems.getIdentifiers().includes(object.id);

		let isAuthorized: boolean = hasPermissions && hasAccess;

		if (context.action === Action.write) {
			isAuthorized = isAuthorized && this.canEdit(object);
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
