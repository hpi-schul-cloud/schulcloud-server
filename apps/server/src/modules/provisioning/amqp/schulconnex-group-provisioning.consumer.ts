import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { type Group, GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchulconnexGroupProvisioningMessage, SchulconnexGroupRemovalMessage } from '../domain';
import { GroupProvisioningSuccessfulLoggable, GroupRemovalSuccessfulLoggable } from '../loggable';
import { ProvisioningConfig } from '../provisioning.config';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';

@Injectable()
export class SchulconnexGroupProvisioningConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexGroupProvisioningService: SchulconnexGroupProvisioningService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		private readonly groupService: GroupService,
		private readonly configService: ConfigService<ProvisioningConfig, true>,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(SchulconnexGroupProvisioningConsumer.name);
	}

	@RabbitSubscribe({
		exchange: SchulconnexProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
		queue: SchulconnexProvisioningEvents.GROUP_PROVISIONING,
	})
	@UseRequestContext()
	public async provisionGroups(
		@RabbitPayload()
		payload: SchulconnexGroupProvisioningMessage
	): Promise<void> {
		const existingGroup: Group | null = await this.groupService.findByExternalSource(
			payload.externalGroup.externalId,
			payload.systemId
		);

		const provisionedGroup: Group | null = await this.schulconnexGroupProvisioningService.provisionExternalGroup(
			payload.externalGroup,
			payload.externalSchool,
			payload.systemId
		);

		if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') && provisionedGroup) {
			await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(provisionedGroup, existingGroup ?? undefined);
		}

		if (provisionedGroup) {
			this.logger.info(
				new GroupProvisioningSuccessfulLoggable(provisionedGroup.id, payload.externalGroup.externalId, payload.systemId)
			);
		}
	}

	@RabbitSubscribe({
		exchange: SchulconnexProvisioningExchange,
		routingKey: SchulconnexProvisioningEvents.GROUP_REMOVAL,
		queue: SchulconnexProvisioningEvents.GROUP_REMOVAL,
	})
	@UseRequestContext()
	public async removeUserFromGroup(
		@RabbitPayload()
		payload: SchulconnexGroupRemovalMessage
	): Promise<void> {
		const removedFromGroup: Group | null = await this.schulconnexGroupProvisioningService.removeUserFromGroup(
			payload.userId,
			payload.groupId
		);

		if (this.configService.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') && removedFromGroup) {
			await this.schulconnexCourseSyncService.synchronizeCourseWithGroup(removedFromGroup, removedFromGroup);
		}

		this.logger.info(new GroupRemovalSuccessfulLoggable(payload.groupId, payload.userId, !removedFromGroup));
	}
}
