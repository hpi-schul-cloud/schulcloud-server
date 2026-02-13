import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EnsureRequestContext, MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { SchulconnexLicenseProvisioningMessage } from '../domain';
import { LicenseProvisioningSuccessfulLoggable } from '../loggable';
import {
	InternalProvisioningExchangeConfig,
	PROVISIONING_EXCHANGE_CONFIG_TOKEN,
} from '../provisioning-exchange.config';
import {
	SchulconnexLicenseProvisioningService,
	SchulconnexToolProvisioningService,
} from '../strategy/schulconnex/service';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

// Using a variable here to access the exchange name in the decorator
let provisionedExchangeName: string | undefined;

@Injectable()
export class SchulconnexLicenseProvisioningConsumer {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		private readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly config: InternalProvisioningExchangeConfig,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(SchulconnexLicenseProvisioningConsumer.name);
		provisionedExchangeName = this.config.exchangeName;
	}

	@RabbitSubscribe({
		exchange: provisionedExchangeName,
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
