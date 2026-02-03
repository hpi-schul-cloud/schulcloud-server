import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { SchulconnexProvisioningEvents, SchulconnexProvisioningExchange } from '@infra/rabbitmq';
import { MikroORM, EnsureRequestContext } from '@mikro-orm/core';
import { type Group, GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchulconnexGroupProvisioningMessage } from '../domain';
import { GroupProvisioningSuccessfulLoggable } from '../loggable';
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
	@EnsureRequestContext()
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
			if (!existingGroup) {
				await this.schulconnexCourseSyncService.synchronizeCoursesFromHistory(provisionedGroup);
			}
		}

		if (provisionedGroup) {
			this.logger.info(
				new GroupProvisioningSuccessfulLoggable(provisionedGroup.id, payload.externalGroup.externalId, payload.systemId)
			);
		}
	}
}
