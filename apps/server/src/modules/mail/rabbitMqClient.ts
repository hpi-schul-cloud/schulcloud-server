import { ClientsModule, Transport } from '@nestjs/microservices';

import { Configuration } from '@hpi-schul-cloud/commons';

export const rabbitMqClient = ClientsModule.register([
    {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
            urls: [Configuration.get('RABBITMQ_URI')],
            queue: Configuration.get('MAIL_SEND_QUEUE_NAME'),
            queueOptions: {
                durable: false,
            },
        },
    },
]);