import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { NewsTargetModelValue } from '../news/entity';
import { FeathersAuthProvider } from './feathers-auth.provider';

export type EntityTypeValue = NewsTargetModelValue | 'school';
@Injectable()
export class AuthorizationService {
	constructor(private authProvider: FeathersAuthProvider) {}

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
				? await this.authProvider.getUserSchoolPermissions(userId, targetId)
				: await this.authProvider.getUserTargetPermissions(userId, targetModel, targetId);
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
				? this.authProvider.getPermittedSchools(userId)
				: this.authProvider.getPermittedTargets(userId, targetModel, permissions);

		return entitiyIds;
	}
}
