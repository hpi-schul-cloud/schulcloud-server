import {DynamicModule, Global, Module, NotFoundException} from "@nestjs/common";
import {AmqpConnection, RabbitMQModule} from "@golevelup/nestjs-rabbitmq";
import {MikroOrmModule, MikroOrmModuleSyncOptions} from "@mikro-orm/nestjs";
import {DB_PASSWORD, DB_URL, DB_USERNAME} from "@src/config";
import {ALL_ENTITIES} from "@shared/domain";
import { Configuration } from '@hpi-schul-cloud/commons';
import {Dictionary, IPrimaryKey} from "@mikro-orm/core";

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
    findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
    },
};

/**
 * https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq#usage
 * we want to have the RabbitMQModule globally available, since it provides via a factory the AMQPConnection.
 * You shall not explicitly declare the AMQPConnection in your modules since it will create a new AMQPConnection which will not be initialized!
 *
 * Therefore, the combination of @Global() and export: [RabbitMQModule] is required.
 */
@Global()
@Module({
    imports: [
        RabbitMQModule.forRoot(RabbitMQModule, {
            exchanges: [
                {
                    name: Configuration.get('MAIL_SEND_EXCHANGE') as string,
                    type: 'direct',
                },
                {
                    name: Configuration.get('ANTIVIRUS_EXCHANGE') as string,
                    type: 'direct',
                },
            ],
            uri: Configuration.get('RABBITMQ_URI') as string,
        }),
        MikroOrmModule.forRoot({
            ...defaultMikroOrmOptions,
            type: 'mongo',
            // TODO add mongoose options as mongo options (see database.js)
            clientUrl: DB_URL,
            password: DB_PASSWORD,
            user: DB_USERNAME,
            entities: ALL_ENTITIES,

            // debug: true, // use it for locally debugging of querys
        }),
    ],
    exports: [RabbitMQModule],
})
export class CommonModule {}