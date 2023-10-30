import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { ContextTypeMapper } from '../mapper/context-type.mapper';

@Injectable()
export class ToolPermissionHelper {
	constructor(
		@Inject(forwardRef(() => AuthorizationService)) private authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService
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
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);
		this.authorizationService.checkPermission(user, school, context);
	}
}
