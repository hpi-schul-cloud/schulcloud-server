import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME, TLDRAW_DB_URL } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { AuthorizationModule } from '@modules/authorization';
import { config } from './config';
import { TldrawDrawing } from './entities';
import { TldrawController } from './controller';
import { TldrawService } from './service';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		LoggerModule,
		AuthorizationModule,
		AuthenticationModule,
		CoreModule,
		RabbitMQWrapperModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: TLDRAW_DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [TldrawDrawing],
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
	],
	providers: [TldrawService, TldrawBoardRepo, TldrawRepo, YMongodb],
	controllers: [TldrawController],
})
export class TldrawModule {}
