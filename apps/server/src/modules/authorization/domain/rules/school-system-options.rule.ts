import { SchoolSystemOptions } from '@modules/legacy-school';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class SchoolSystemOptionsRule implements Rule<SchoolSystemOptions> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof SchoolSystemOptions;

		return isMatched;
	}

	public hasPermission(user: User, object: SchoolSystemOptions, context: AuthorizationContext): boolean {
		const hasPermissions: boolean = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		const isAtSchool: boolean = user.school.id === object.schoolId;

		const hasSystem: boolean = user.school.systems.getIdentifiers().includes(object.systemId);

		const isAuthorized: boolean = hasPermissions && isAtSchool && hasSystem;

		return isAuthorized;
	}
}
