import { ForbiddenException, Injectable } from '@nestjs/common';
import { Actions, AuthorizationContextBuilder, EntityId, Permission, User } from '@shared/domain';
import { AuthorizableObjectType, IAuthorizationContext } from '@shared/domain/interface';
import { AuthorisationUtils } from '@shared/domain/rules/authorisation.utils';
import { RuleManager } from '@shared/domain/rules/rule-manager';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends AuthorisationUtils {
	constructor(private readonly loader: ReferenceLoader, private readonly ruleManager: RuleManager) {
		super();
	}

	checkPermission(user: User, entity: AuthorizableObjectType, context: IAuthorizationContext) {
		if (!this.ruleManager.hasPermission(user, entity, context)) {
			throw new ForbiddenException();
		}
	}

	hasPermission(user: User, entity: AuthorizableObjectType, context: IAuthorizationContext) {
		return this.ruleManager.hasPermission(user, entity, context);
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IAuthorizationContext
	): Promise<boolean> {
		try {
			const [user, entity] = await Promise.all([
				this.loader.loadEntity(AllowedAuthorizationEntityType.User, userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const permission = this.ruleManager.hasPermission(user as User, entity, context);

			return permission;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}

	hasPermissionsByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		permissions: Permission[],
		action: Actions
	): Map<Permission, Promise<boolean>> {
		const returnMap: Map<Permission, Promise<boolean>> = new Map();
		permissions.forEach((perm) => {
			const context =
				action === Actions.read ? AuthorizationContextBuilder.read([perm]) : AuthorizationContextBuilder.write([perm]);
			const ret = this.hasPermissionByReferences(userId, entityName, entityId, context);
			returnMap.set(perm, ret);
		});
		return returnMap;
	}

	async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IAuthorizationContext
	) {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenException();
		}
	}

	async getUserWithPermissions(userId: EntityId): Promise<User> {
		try {
			const userWithPermissions: User = (await this.loader.loadEntity(
				AllowedAuthorizationEntityType.User,
				userId
			)) as User;

			return userWithPermissions;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}
}
