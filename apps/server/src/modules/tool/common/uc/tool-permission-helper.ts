import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Course, EntityId, LegacySchoolDo, User } from '@shared/domain';
import { AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { CourseRepo } from '@shared/repo';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
// import { ContextTypeMapper } from '../mapper';

@Injectable()
export class ToolPermissionHelper {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly courseRepo: CourseRepo
	) {}

	// TODO build interface to get contextDO by contextType
	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		const [authorizableUser, course]: [User, Course] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.courseRepo.findById(contextExternalTool.contextRef.id),
		]);

		if (contextExternalTool.id) {
			this.authorizationService.checkPermission(authorizableUser, contextExternalTool, context);
		}

		// const type = ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextExternalTool.contextRef.type);
		// no different types possible until it is fixed.
		this.authorizationService.checkPermission(authorizableUser, course, context);
	}

	public async ensureSchoolPermissions(
		userId: EntityId,
		schoolExternalTool: SchoolExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		const [user, school]: [User, LegacySchoolDo] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolService.getSchoolById(schoolExternalTool.schoolId),
		]);

		this.authorizationService.checkPermission(user, school, context);
	}
}
