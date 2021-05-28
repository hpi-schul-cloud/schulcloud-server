import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseEntity, EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { NewsTargetModelValue } from '../news/entity';
import { FeathersServiceProvider } from './feathers-service.provider';

interface User {
	_id: ObjectId;
	schoolId: ObjectId;
	permissions: string[];
}

@Injectable()
export class FeathersAuthProvider {
	constructor(private serviceProvider: FeathersServiceProvider) {}

	async getUserSchoolPermissions(userId: EntityId, schoolId: EntityId): Promise<string[]> | never {
		const user = await this.getUser(userId);
		// test user is school member
		const sameSchool = user.schoolId.equals(schoolId);
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	async getUserTargetPermissions(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		targetId: EntityId
	): Promise<string[]> {
		const service = this.serviceProvider.getService(`${targetModel}/:scopeId/userPermissions/`);
		const targetPermissions = (await service.get(userId, {
			route: { scopeId: targetId },
		})) as string[];
		return targetPermissions;
	}

	async getPermittedTargets(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		permissions: string[]
	): Promise<EntityId[]> {
		const service = this.serviceProvider.getService(`/users/:scopeId/${targetModel}`);
		const targets = (await service.find({
			route: { scopeId: userId.toString() },
			query: {
				permissions,
			},
			paginate: false,
		})) as BaseEntity[];
		const targetIds = targets.map((target) => target._id.toString());
		return targetIds;
	}

	async getPermittedSchools(userId: EntityId): Promise<EntityId[]> {
		const user = await this.getUser(userId);
		return [user.schoolId.toString()] as EntityId[];
	}

	private async getUser(userId: EntityId): Promise<User> {
		const service = this.serviceProvider.getService('users');
		const user = (await service.get(userId)) as User;
		if (user == null) throw new NotFoundException();
		return user;
	}
}
