import { ForbiddenException, Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { AuthorisationUtils, CourseRule, EntityId, TaskRule, User, UserRule, SchoolRule } from '@shared/domain';
import { IEntity, IPermissionContext, PermissionPublisher, PermissionAdapter } from '@shared/domain/interface';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

enum ErrorMessages {
	RULE_NOT_IMPLEMENT = 'RULE_NOT_IMPLEMENT',
	MULTIPLE_MATCHES_ARE_NOT_ALLOWED = 'MULTIPLE_MATCHES_ARE_NOT_ALLOWED',
}

@Injectable()
export class AuthorizationService extends AuthorisationUtils implements PermissionAdapter {
	permissionLayers: PermissionPublisher[];

	constructor(
		private readonly courseRule: CourseRule,
		private readonly taskRule: TaskRule,
		private readonly schoolRule: SchoolRule,
		private readonly userRule: UserRule,
		private readonly service: ReferenceLoader
	) {
		super();

		this.permissionLayers = [this.courseRule, this.taskRule, this.userRule, this.schoolRule];
	}

	private interpretLayerMatches(layers: PermissionPublisher[]): PermissionPublisher {
		if (layers.length === 0) {
			throw new NotImplementedException(ErrorMessages.RULE_NOT_IMPLEMENT);
		}
		if (layers.length > 1) {
			throw new InternalServerErrorException(ErrorMessages.MULTIPLE_MATCHES_ARE_NOT_ALLOWED);
		}
		return layers[0];
	}

	resolveLayer(user: User, entity: IEntity, context?: IPermissionContext): PermissionPublisher {
		const layers = this.permissionLayers.filter((rule) => rule.checkCondition(user, entity, context));

		const layer = this.interpretLayerMatches(layers);

		return layer;
	}

	checkCondition(user: User, entity: IEntity, context: IPermissionContext): boolean {
		this.resolveLayer(user, entity, context);

		return true;
	}

	hasPermission(user: User, entity: IEntity, context: IPermissionContext): boolean {
		const layer = this.resolveLayer(user, entity, context);

		const hasPermission = layer.hasPermission(user, entity, context);

		return hasPermission;
	}

	checkPermission(user: User, entity: IEntity, context: IPermissionContext) {
		if (!this.hasPermission(user, entity, context)) {
			throw new ForbiddenException();
		}
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IPermissionContext
	): Promise<boolean> {
		const [user, entity] = await Promise.all([
			this.service.getUserWithPermissions(userId),
			this.service.loadEntity(entityName, entityId),
		]);
		const permission = this.hasPermission(user, entity, context);

		return permission;
	}

	async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IPermissionContext
	) {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenException();
		}
	}

	async getUserWithPermissions(userId: EntityId) {
		return this.service.getUserWithPermissions(userId);
	}
}
