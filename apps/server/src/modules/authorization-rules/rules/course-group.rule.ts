import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { CourseGroupEntity } from '@modules/course/repo';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { CourseRule } from './course.rule';
import { Permission } from '@shared/domain/interface/permission.enum';

@Injectable()
export class CourseGroupRule implements Rule<CourseGroupEntity> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly courseRule: CourseRule,
		injectionService: AuthorizationInjectionService
	) {
		injectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof CourseGroupEntity;

		return isMatched;
	}

	public hasPermission(user: User, courseGroup: CourseGroupEntity, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, courseGroup, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, courseGroup, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, object: CourseGroupEntity, context: AuthorizationContext): boolean {
		const isStudentInCourseGroup = this.isStudentInCourseGroup(user, object);
		// Permissions are missing here
		const hasReadPermissions = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return (
			hasInstanceReadOperationPermission ||
			(hasReadPermissions && isStudentInCourseGroup) ||
			this.hasCourseWriteAccess(user, object, context)
		);
	}

	private hasWriteAccess(user: User, object: CourseGroupEntity, context: AuthorizationContext): boolean {
		return this.hasReadAccess(user, object, context);
	}

	private hasCourseWriteAccess(user: User, object: CourseGroupEntity, context: AuthorizationContext): boolean {
		return this.courseRule.hasPermission(user, object.course, {
			action: Action.write,
			requiredPermissions: context.requiredPermissions,
		});
	}

	private isStudentInCourseGroup(user: User, object: CourseGroupEntity): boolean {
		return this.authorizationHelper.hasAccessToEntity(user, object, ['students']);
	}
}
