import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EnsureRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { SchulconnexLicenseProvisioningMessage } from '../domain';
import { LicenseProvisioningSuccessfulLoggable } from '../loggable';
import { PROVISIONING_EXCHANGE_NAME } from '../provisioning-exchange.config';
import {
	SchulconnexLicenseProvisioningService,
	SchulconnexToolProvisioningService,
} from '../strategy/schulconnex/service';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

@Injectable()
export class SchulconnexLicenseProvisioningConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		private readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(SchulconnexLicenseProvisioningConsumer.name);
	}

	@RabbitSubscribe({
		exchange: PROVISIONING_EXCHANGE_NAME,
		routingKey: SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
		queue: SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
	})
	@EnsureRequestContext()
	public async provisionLicenses(@RabbitPayload() payload: SchulconnexLicenseProvisioningMessage): Promise<void> {
		await this.schulconnexLicenseProvisioningService.provisionExternalLicenses(
			payload.userId,
			payload.externalLicenses
		);
		await this.schulconnexToolProvisioningService.provisionSchoolExternalTools(
			payload.userId,
			payload.schoolId,
			payload.systemId
		);

		this.logger.info(new LicenseProvisioningSuccessfulLoggable(payload.userId, payload.externalLicenses.length));
	}
}
