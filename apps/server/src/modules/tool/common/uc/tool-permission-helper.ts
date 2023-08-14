import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId, SchoolDO, User } from '@shared/domain';
import { AuthorizableReferenceType, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextTypeMapper } from '../mapper';

@Injectable()
export class ToolPermissionHelper {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) private authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	// TODO build interface to get contextDO by contextType
	public async ensureContextPermissions(
		userId: EntityId,
		contextExternalTool: ContextExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		if (contextExternalTool.id) {
			await this.authorizationService.checkPermissionByReferences(
				userId,
				AuthorizableReferenceType.ContextExternalToolEntity,
				contextExternalTool.id,
				context
			);
		}

		await this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextExternalTool.contextRef.type),
			contextExternalTool.contextRef.id,
			context
		);
	}

	public async ensureSchoolPermissions(
		userId: EntityId,
		schoolExternalTool: SchoolExternalTool,
		context: AuthorizationContext
	): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);
		this.authorizationService.checkPermission(user, school, context);
	}
}
