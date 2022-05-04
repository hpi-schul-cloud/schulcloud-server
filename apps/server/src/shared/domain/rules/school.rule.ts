import { Injectable } from '@nestjs/common';
import type { User } from '@shared/domain';
import { School } from '../entity';
import { Actions } from './actions.enum';
import { BaseRule } from './base.rule';

@Injectable()
export class SchoolRule extends BaseRule {
	hasPermission(user: User, entity: School, action: Actions): boolean {
		const hasPermission = user.school === entity;

		return hasPermission;
	}
}
