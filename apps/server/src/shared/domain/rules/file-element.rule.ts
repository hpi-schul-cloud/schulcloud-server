import { Injectable } from '@nestjs/common';
import { FileElement } from '../domainobject';
import { User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';

@Injectable()
export class FileElementRule extends BasePermission<FileElement> {
	public isApplicable(user: User, entity: FileElement): boolean {
		const isMatched = entity instanceof FileElement;

		return isMatched;
	}

	public hasPermission(user: User, entity: FileElement, context: IPermissionContext): boolean {
		const hasPermission = this.utils.hasAllPermissions(user, context.requiredPermissions);

		// TODO: create really permission checks

		return hasPermission;
	}
}
