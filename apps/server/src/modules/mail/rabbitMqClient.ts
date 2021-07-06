/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// TODO remove line above

import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { Configuration } from '@hpi-schul-cloud/commons';

export const rabbitMqClient = RabbitMQModule.forRoot(RabbitMQModule, {
	exchanges: [
		{
			name: Configuration.get('MAIL_SEND_EXCHANGE'),
			type: 'direct',
		},
	],
	uri: Configuration.get('RABBITMQ_URI'),
});
