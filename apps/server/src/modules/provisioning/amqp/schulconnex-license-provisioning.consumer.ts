import { Logger } from '@core/logger';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
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
import { registerAmqpSubscriber } from './amqp-subscriber.helper';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

@Injectable()
export class SchulconnexLicenseProvisioningConsumer implements OnModuleInit {
	constructor(
		private readonly logger: Logger,
		private readonly schulconnexLicenseProvisioningService: SchulconnexLicenseProvisioningService,
		private readonly schulconnexToolProvisioningService: SchulconnexToolProvisioningService,
		@Inject(PROVISIONING_EXCHANGE_CONFIG_TOKEN) private readonly config: InternalProvisioningExchangeConfig,
		private readonly orm: MikroORM,
		private readonly amqpConnection: AmqpConnection
	) {
		this.logger.setContext(SchulconnexLicenseProvisioningConsumer.name);
	}

	public async onModuleInit(): Promise<void> {
		await registerAmqpSubscriber(
			this.amqpConnection,
			this.config.exchangeName,
			SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
			(payload: SchulconnexLicenseProvisioningMessage) => this.provisionLicenses(payload),
			SchulconnexLicenseProvisioningConsumer.name
		);
	}

	public async provisionLicenses(payload: SchulconnexLicenseProvisioningMessage): Promise<void> {
		await RequestContext.create(this.orm.em, async () => {
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
		});
	}
}
