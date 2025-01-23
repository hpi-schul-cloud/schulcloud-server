import { FeathersServiceProvider } from '@infra/feathers/feathers-service.provider';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { BaseEntity } from '@shared/domain/entity/base.entity';
import type { EntityId } from '@shared/domain/types/entity-id';
import { NewsTargetModel } from '@shared/domain/types/news.types';

interface User {
	_id: ObjectId;
	schoolId: ObjectId;
	permissions: string[];
}

@Injectable()
export class FeathersAuthProvider {
	constructor(private feathersServiceProvider: FeathersServiceProvider) {}

	public async getUserSchoolPermissions(userId: EntityId, schoolId: EntityId): Promise<string[]> | never {
		const user = await this.getUser(userId);
		// test user is school member
		const sameSchool = user.schoolId.toString() === schoolId;
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	public async getUserTargetPermissions(
		userId: EntityId,
		targetModel: NewsTargetModel,
		targetId: EntityId
	): Promise<string[]> {
		let path = `${targetModel}/:scopeId/userPermissions/`;
		if (targetModel === 'courses') {
			path = `coursesUserPermissions/:scopeId`;
		}
		const service = this.feathersServiceProvider.getService(path);
		const targetPermissions = (await service.get(userId, {
			route: { scopeId: targetId },
		})) as string[];
		return targetPermissions;
	}

	public async getPermittedTargets(
		userId: EntityId,
		targetModel: NewsTargetModel,
		permissions: string[]
	): Promise<EntityId[]> {
		const service = this.feathersServiceProvider.getService(`/users/:scopeId/${targetModel}`);
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

	public async getPermittedSchools(userId: EntityId): Promise<EntityId[]> {
		const user = await this.getUser(userId);
		return [user.schoolId.toString()] as EntityId[];
	}

	private async getUser(userId: EntityId): Promise<User> {
		const service = this.feathersServiceProvider.getService('users');
		const user = (await service.get(userId)) as User;
		if (user == null) throw new NotFoundException();
		return user;
	}
}
