import { Injectable } from '@nestjs/common';
import type { FileRecord, User } from '@shared/domain';
import { Actions } from './actions.enum';
import { BaseRule } from './base.rule';
import { CourseRule } from './course.rule';

@Injectable()
export class FileRecordRule extends BaseRule {
	constructor(private readonly courseRule: CourseRule) {
		super();
	}

	hasPermission(user: User, entity: FileRecord, action: Actions): boolean {
		const isCreator = this.hasAccessToEntity(user, entity, ['creatorId']);

		const hasPermission = isCreator;
		return hasPermission;
	}
}
