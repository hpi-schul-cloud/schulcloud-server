import { IUser } from '@lumieducation/h5p-server';
import { EntityId } from '@shared/domain/types';
import { H5PContentParentType } from '../entity';

export interface H5PContentParentParams {
	schoolId: EntityId;
	parentType: H5PContentParentType;
	parentId: EntityId;
}

export class LumiUserWithContentData implements IUser {
	contentParentType: H5PContentParentType;

	contentParentId: EntityId;

	schoolId: EntityId;

	email: string;

	id: EntityId;

	name: string;

	type: 'local' | string;

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
