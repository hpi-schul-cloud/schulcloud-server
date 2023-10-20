import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Course, EntityId, LegacySchoolDo, User } from '@shared/domain';
import { AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { CourseService } from '@src/modules/learnroom';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
// import { ContextTypeMapper } from '../mapper';

@Injectable()
export class ToolPermissionHelper {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		// invalid dependency on this place it is in UC layer in a other module
		// loading of ressources should be part of service layer
		// if it must resolve different loadings based on the request it can be added in own service and use in UC
		private readonly courseService: CourseService
	) {}

	// TODO build interface to get contextDO by contextType
	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		// loading of ressources should be part of the UC -> unnessasary awaits
		const [authorizableUser, course]: [User, Course] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.courseService.findById(contextExternalTool.contextRef.id),
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
		// loading of ressources should be part of the UC  -> unnessasary awaits
		const [user, school]: [User, LegacySchoolDo] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.schoolService.getSchoolById(schoolExternalTool.schoolId),
		]);

		this.authorizationService.checkPermission(user, school, context);
	}
}
