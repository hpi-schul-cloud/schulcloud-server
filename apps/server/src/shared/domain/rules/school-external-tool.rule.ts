import { Injectable } from '@nestjs/common';
import { SchoolExternalTool, User } from '../entity';
import { IPermissionContext } from '../interface';
import { BasePermission } from './base-permission';
import { SchoolExternalToolDO } from '../domainobject/tool/school-external-tool.do';

@Injectable()
export class SchoolExternalToolRule extends BasePermission<SchoolExternalTool | SchoolExternalToolDO> {
	public isApplicable(user: User, entity: SchoolExternalTool | SchoolExternalToolDO): boolean {
		const isMatched: boolean = entity instanceof SchoolExternalTool || entity instanceof SchoolExternalToolDO;

		return isMatched;
	}

	public hasPermission(
		user: User,
		entity: SchoolExternalTool | SchoolExternalToolDO,
		context: IPermissionContext
	): boolean {
		let hasPermission: boolean;
		if (entity instanceof SchoolExternalTool) {
			hasPermission =
				this.utils.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.school.id;
		} else {
			hasPermission =
				this.utils.hasAllPermissions(user, context.requiredPermissions) && user.school.id === entity.schoolId;
		}
		return hasPermission;
	}
}
