import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { FeathersServiceProvider } from './feathers-service.provider';

import CompareHelper = require('../../../../../src/helper/compare'); // TODO move to lib
import { NewsTargetModelValue } from '../news/entity';

const { equal: equalId } = CompareHelper.ObjectId;

@Injectable()
export class AuthorizationService {
	constructor(private feathersServiceProvider: FeathersServiceProvider) {}

	/**
	 * Get all permissions of a user for a school
	 * @param userId
	 * @param schoolId
	 * @returns
	 * @throws NotFoundException if the user doesn't exist
	 */
	async getUserSchoolPermissions(userId: EntityId, schoolId: EntityId): Promise<string[]> | never {
		const user = await this.feathersServiceProvider.get('users', userId);
		if (user == null) throw new NotFoundException();

		// test user is school member
		const sameSchool: boolean = equalId(schoolId, user.schoolId) as boolean;
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	async checkEntityPermissions(
		userId: EntityId,
		targetModel: NewsTargetModelValue | 'school',
		targetId: EntityId,
		permissions: string[]
	): Promise<void> | never {
		const entityPermissions = await this.getEntityPermissions(userId, targetModel, targetId);
		const hasPermissions = permissions.every((p) => entityPermissions.includes(p));
		if (!hasPermissions) {
			throw new UnauthorizedException('Insufficient permissions');
		}
	}

	/**
	 *
	 * @param userId
	 * @param targetModel
	 * @param permissions
	 */
	async getPermittedTargets(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		permissions: string[]
	): Promise<EntityId[]> {
		const targets = await this.feathersServiceProvider.find(`/users/:scopeId/${targetModel}`, {
			route: { scopeId: userId.toString() },
			query: {
				permissions,
			},
			paginate: false,
		});
		return targets.map((item) => item._id.toString());
	}

	/**
	 *
	 * @param userId
	 * @param targetModel
	 * @param targetId
	 */
	async getUserTargetPermissions(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		targetId: EntityId
	): Promise<string[]> {
		const targetPermissions: string[] = await this.feathersServiceProvider.get(
			`${targetModel}/:scopeId/userPermissions/`,
			userId,
			{ route: { scopeId: targetId } }
		);
		// TODO service response is string array?
		return targetPermissions;
	}

	async getEntityPermissions(userId: EntityId, targetModel: NewsTargetModelValue | 'school', targetId: EntityId) {
		const permissions =
			targetModel === 'school'
				? await this.getUserSchoolPermissions(userId, targetId)
				: await this.getUserTargetPermissions(userId, targetModel, targetId);
		return permissions;
	}
}
