import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { NewsTargetModelValue } from '../news/entity';
import { FeathersAuthProvider } from './feathers-auth.provider';

export type EntityTypeValue = NewsTargetModelValue | 'school';

@Injectable()
export class AuthorizationService {
	constructor(private authProvider: FeathersAuthProvider) {}

	/**
	 * Get all permissions a user has for a specific entity
	 * @param userId
	 * @param targetModel
	 * @param targetId
	 * @returns The list of entity permissions for the user
	 */
	async getEntityPermissions(userId: EntityId, targetModel: EntityTypeValue, targetId: EntityId): Promise<string[]> {
		const permissions =
			targetModel === 'school'
				? await this.authProvider.getUserSchoolPermissions(userId, targetId)
				: await this.authProvider.getUserTargetPermissions(userId, targetModel, targetId);
		return permissions;
	}

	/**
	 * Ensure that a user has sufficient permissions for a specific entity
	 * @param userId
	 * @param targetModel
	 * @param targetId
	 * @param permissions
	 * @throws UnauthorizedException if the permissions are not satisfied
	 */
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

	/**
	 * Get all entities for which a user has specific permissions
	 * @param userId
	 * @param targetModel
	 * @param permissions
	 * @returns The list of ids of all entities that satisfy the provided permissions for the user
	 */
	async getPermittedEntities(
		userId: EntityId,
		targetModel: EntityTypeValue,
		permissions: string[]
	): Promise<EntityId[]> {
		const entitiyIds =
			targetModel === 'school'
				? this.authProvider.getPermittedSchools(userId)
				: this.authProvider.getPermittedTargets(userId, targetModel, permissions);

		return entitiyIds;
	}
}
