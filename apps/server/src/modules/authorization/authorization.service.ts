import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BaseEntity, EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { FeathersServiceProvider } from './feathers-service.provider';
import { NewsTargetModelValue } from '../news/entity';

interface User {
	_id: ObjectId;
	schoolId: ObjectId;
	permissions: string[];
}

export type EntityTypeValue = NewsTargetModelValue | 'school';
@Injectable()
export class AuthorizationService {
	constructor(private feathersServiceProvider: FeathersServiceProvider) {}

	/**
	 *
	 * @param userId
	 * @param targetModel
	 * @param targetId
	 * @returns
	 */
	async getEntityPermissions(userId: EntityId, targetModel: EntityTypeValue, targetId: EntityId): Promise<string[]> {
		const permissions =
			targetModel === 'school'
				? await this.getUserSchoolPermissions(userId, targetId)
				: await this.getUserTargetPermissions(userId, targetModel, targetId);
		return permissions;
	}

	async checkEntityPermissions(
		userId: EntityId,
		targetModel: EntityTypeValue,
		targetId: EntityId,
		permissions: string[]
	): Promise<void> | never {
		const entityPermissions = await this.getEntityPermissions(userId, targetModel, targetId);
		const hasPermissions = permissions.every((p) => entityPermissions.includes(p));
		if (!hasPermissions) {
			throw new UnauthorizedException('Insufficient permissions');
		}
	}

	async getPermittedEntities(
		userId: EntityId,
		targetModel: EntityTypeValue,
		permissions: string[]
	): Promise<EntityId[]> {
		const entitiyIds =
			targetModel === 'school'
				? this.getPermittedSchools(userId)
				: this.getPermittedTargets(userId, targetModel, permissions);

		return entitiyIds;
	}

	private async getUserSchoolPermissions(userId: EntityId, schoolId: EntityId): Promise<string[]> | never {
		const user = await this.getUser(userId);
		// test user is school member
		const sameSchool = user.schoolId.equals(schoolId);
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	private async getUserTargetPermissions(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		targetId: EntityId
	): Promise<string[]> {
		const targetPermissions = (await this.feathersServiceProvider.get(
			`${targetModel}/:scopeId/userPermissions/`,
			userId,
			{ route: { scopeId: targetId } }
		)) as string[];
		return targetPermissions;
	}

	private async getPermittedTargets(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		permissions: string[]
	): Promise<EntityId[]> {
		const targets = (await this.feathersServiceProvider.find(`/users/:scopeId/${targetModel}`, {
			route: { scopeId: userId.toString() },
			query: {
				permissions,
			},
			paginate: false,
		})) as BaseEntity[];
		return targets.map((item) => item._id.toString());
	}

	private async getPermittedSchools(userId: EntityId): Promise<EntityId[]> {
		const user = await this.getUser(userId);
		return [user._id.toString()] as EntityId[];
	}

	private async getUser(userId: EntityId): Promise<User> {
		const user = (await this.feathersServiceProvider.get('users', userId)) as User;
		if (user == null) throw new NotFoundException();
		return user;
	}
}
