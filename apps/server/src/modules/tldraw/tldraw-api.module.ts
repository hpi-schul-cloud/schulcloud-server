import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions, DB_PASSWORD, DB_USERNAME } from '@src/config';
import { CoreModule } from '@src/core';
import { LoggerModule } from '@src/core/logger';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { config, TLDRAW_DB_URL } from './config';
import { TldrawController } from './controller';
import { TldrawDrawing } from './entities';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from './repo';
import { TldrawService } from './service';

@Module({
	imports: [
		LoggerModule,
		CoreModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: TLDRAW_DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [TldrawDrawing],
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		AuthGuardModule.register([AuthGuardOptions.X_API_KEY]),
	],
	providers: [TldrawService, TldrawBoardRepo, TldrawRepo, YMongodb],
	controllers: [TldrawController],
})
export class TldrawApiModule {}
