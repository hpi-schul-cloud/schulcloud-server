import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { FeathersServiceProvider } from './feathers-service.provider';

type Permission = 'foo' | 'bar';
type Model = 'school' | 'course' | 'team'; // TODO use it
interface Target {
	targetId: EntityId;
	targetModel: string;
}

import CompareHelper = require('../../../../../src/helper/compare'); // TODO move to lib
import { EntityId } from '../../shared/domain';
import { NewsTargetModel } from '../news/entity';
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
		const sameSchool = equalId(schoolId, user.schoolId);
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	/**
	 * Check permissions of a user for a school
	 * @param userId
	 * @param schoolId
	 * @param permissions
	 * @returns
	 * @throws NotFoundException if the user doesn't exist
	 * 				 UnauthorizedException if the user doesn't have the specified permissions
	 */
	async checkUserSchoolPermissions(userId: EntityId, schoolId: EntityId, permissions: string[]): Promise<void> | never {
		const userSchoolPermissions = await this.getUserSchoolPermissions(userId, schoolId);
		const hasPermissions = permissions.every((p) => userSchoolPermissions.includes(p));

		if (hasPermissions === false) {
			// TODO decide wether to throw or return boolean
			// TODO provide more error information
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
		targetModel: NewsTargetModel,
		permissions: string[]
	): Promise<EntityId[]> {
		const targets = await this.feathersServiceProvider.find(`/users/:scopeId/${targetModel}`, {
			route: { scopeId: userId.toString() },
			query: {
				permissions: permissions,
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
	// async getTartgetPermissions(userId: EntityId, targetModel: NewsTargetModel, targetId: EntityId): Promise<string[]> {}

	async getUserPermissions(userId: EntityId, target: Target): Promise<string[]> {
		const params = { route: { scopeId: target.targetId } };
		if (target.targetModel === 'school') {
			const schoolPermissions = await this.getUserSchoolPermissions(userId, target.targetId);
			// TODO service response is string array?
			return schoolPermissions;
		}
		// otherwise a scope must implement userPermissions:
		// TODO check the service implements userPermissions
		const targetPermissions: string[] = await this.feathersServiceProvider.get(
			`${target.targetModel}/:scopeId/userPermissions/`,
			userId,
			params
		);
		// TODO service response is string array?
		return targetPermissions;
	}
}
