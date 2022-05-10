import { Injectable } from '@nestjs/common';
import type { FileRecord, User } from '@shared/domain';
import { IPermissionContext } from '../interface/permission';
import { BaseRule } from './base.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class FileRecordRule extends BaseRule {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	hasPermission(user: User, entity: FileRecord, context: IPermissionContext): boolean {
		const isCreator = this.hasAccessToEntity(user, entity, ['creatorId']);
		const hasPermission = this.hasAllPermissions(user, context.requiredPermissions);

		const result = hasPermission && isCreator;
		return result;
	}
}
