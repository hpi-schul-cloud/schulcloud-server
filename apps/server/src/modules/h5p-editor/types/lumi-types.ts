import { H5PContentParentType } from '@infra/rabbitmq';
import { IUser } from '@lumieducation/h5p-server';
import { EntityId } from '@shared/domain/types';

export interface H5PContentParentParams {
	schoolId: EntityId;
	parentType: H5PContentParentType;
	parentId: EntityId;
}

export class LumiUserWithContentData implements IUser {
	public contentParentType: H5PContentParentType;

	public contentParentId: EntityId;

	public schoolId: EntityId;

	public email: string;

	public id: EntityId;

	public name: string;

	public type: 'local' | string;

	constructor(user: IUser, parentParams: H5PContentParentParams) {
		this.contentParentType = parentParams.parentType;
		this.contentParentId = parentParams.parentId;
		this.schoolId = parentParams.schoolId;

		this.email = user.email;
		this.id = user.id;
		this.name = user.name;
		this.type = user.type;
	}
}
