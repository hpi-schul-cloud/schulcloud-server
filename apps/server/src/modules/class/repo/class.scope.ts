import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { ClassEntity } from '../entity';

export class ClassScope extends Scope<ClassEntity> {
	public bySchoolId(schoolId?: EntityId): this {
		if (schoolId) {
			this.addQuery({ schoolId: new ObjectId(schoolId) });
		}
		return this;
	}

	public byUserId(userId?: EntityId): this {
		if (userId) {
			this.addQuery({ $or: [{ userIds: new ObjectId(userId) }, { teacherIds: new ObjectId(userId) }] });
		}
		return this;
	}
}
