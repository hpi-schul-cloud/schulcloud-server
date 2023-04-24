import { Injectable } from '@nestjs/common';
import { AnyBoardDo, BoardComposite } from '../domainobject';
import { User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';

@Injectable()
export class BoardNodeRule extends BasePermission<AnyBoardDo> {
	public isApplicable(user: User, entity: AnyBoardDo): boolean {
		const isMatched = entity instanceof BoardComposite;

		return isMatched;
	}

	public hasPermission(user: User, entity: AnyBoardDo, context: IPermissionContext): boolean {
		const hasPermission = this.utils.hasAllPermissions(user, context.requiredPermissions);

		// TODO: create really permission checks

		return hasPermission;
	}
}
