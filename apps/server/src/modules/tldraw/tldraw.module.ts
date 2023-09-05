import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME, TLDRAW_DB_URL } from '@src/config';
import { CoreModule } from '@src/core';
import { Logger } from '@src/core/logger';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { TldrawDrawing } from '@src/modules/tldraw/entities';
import { TldrawService } from '@src/modules/tldraw/service/tldraw.service';
import { TldrawRepo } from '@src/modules/tldraw/repo/tldraw.repo';
import { AuthenticationModule } from '@src/modules/authentication/authentication.module';
import { AuthorizationModule } from '@src/modules';
import { RabbitMQWrapperTestModule } from '@shared/infra/rabbitmq';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { config } from './config';
import { TldrawController } from './controller/tldraw.controller';

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(`The requested ${entityName}: ${where} has not been found.`),
};

@Module({
	imports: [
		AuthorizationModule,
		AuthenticationModule,
		CoreModule,
		RabbitMQWrapperTestModule,
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
	providers: [Logger, TldrawService, TldrawRepo],
	controllers: [TldrawController],
})
export class TldrawModule {}
