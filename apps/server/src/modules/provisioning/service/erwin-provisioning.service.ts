import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { BadDataLoggableException, ExternalIdMissingLoggableException } from '../loggable';
import {
	ProvisioningContext,
	ProvisioningEntityHandler,
	ProvisioningResult,
} from './erwin-provisioning-handler.interface';
import { SchoolProvisioningHandler } from './school-provisioning.handler';
import { UserProvisioningHandler } from './user-provisioning.handler';

export enum ProvisioningEntityType {
	USER = 'USER',
	SCHOOL = 'SCHOOL',
	CLASS = 'CLASS',
}

@Injectable()
export class ErwinProvisioningService {
	private readonly handlers: Map<ProvisioningEntityType, ProvisioningEntityHandler>;

	constructor(
		private readonly erwinIdentifierService: ErwinIdentifierService,
		private readonly schoolProvisioningHandler: SchoolProvisioningHandler,
		private readonly userProvisioningHandler: UserProvisioningHandler
	) {
		this.handlers = new Map<ProvisioningEntityType, ProvisioningEntityHandler>();
		this.handlers.set(ProvisioningEntityType.SCHOOL, this.schoolProvisioningHandler);
		this.handlers.set(ProvisioningEntityType.USER, this.userProvisioningHandler);
		// TODO: Register class handler when implementing class provisioning
	}

	public async provisionEntity(
		entityType: ProvisioningEntityType,
		context: ProvisioningContext
	): Promise<ProvisioningResult> {
		const handler = this.getHandler(entityType);

		handler.validate(context);

		return await this.executeProvisioningFlow(handler, context);
	}

	private async executeProvisioningFlow(
		handler: ProvisioningEntityHandler,
		context: ProvisioningContext
	): Promise<ProvisioningResult> {
		const externalData = handler.getExternalData(context);
		const erwinId = handler.getErwinId(context);

		if (erwinId) {
			const erwinIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

			if (erwinIdentifier?.type === handler.referencedEntityType) {
				const entity: ProvisioningResult | null = await handler.findByEntityId(erwinIdentifier.referencedEntityId);

				if (entity) {
					return externalData.externalId ? handler.update(entity, externalData) : entity;
				}
			}
		}

		TypeGuard.requireKeys(
			externalData,
			['externalId'],
			new ExternalIdMissingLoggableException(handler.dtoName, { erwinId })
		);

		const entityByExternalId = await handler.findByExternalId(context);

		if (entityByExternalId) {
			const updated = await handler.update(entityByExternalId, externalData);

			if (erwinId) {
				await this.addErwinIdReference(handler.referencedEntityType, this.getEntityId(updated), erwinId);
			}

			return updated;
		}

		return handler.create(context);
	}

	private getHandler(entityType: ProvisioningEntityType): ProvisioningEntityHandler {
		const handler = this.handlers.get(entityType);

		if (!handler) {
			throw new BadDataLoggableException(`No handler registered for entity type: ${entityType}`);
		}

		return handler;
	}

	private getEntityId(entity: ProvisioningResult): string {
		if ('id' in entity && entity.id) {
			return entity.id;
		}
		throw new BadDataLoggableException('Entity does not have an id');
	}

	private async addErwinIdReference(
		referencedType: ReferencedEntityType,
		entityId: string,
		erwinId: string
	): Promise<void> {
		const existingIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (existingIdentifier) {
			return;
		}

		await this.erwinIdentifierService.createErwinIdentifier({
			erwinId,
			type: referencedType,
			referencedEntityId: entityId,
		});
	}

	// TODO: Add Class-specific methods (findClassByExternalId, createClassEntity, updateClassEntity) when implementing Class provisioning
}
