import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '@modules/user/repo';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { authorizationClientConfig, config } from './common-cartridge.config';
import { CommonCartridgeModule } from './common-cartridge.module';
import { CommonCartridgeController } from './controller/common-cartridge.controller';
import { MongoDriver } from '@mikro-orm/mongodb';

@Module({
	imports: [
		CoreModule,
		HttpModule,
		AuthorizationClientModule.register(authorizationClientConfig),
		AuthGuardModule.register([AuthGuardOptions.JWT]),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
		CommonCartridgeModule,
		// Will remove this in the BC-8925
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			driver: MongoDriver,
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [User],
		}),
	],
	controllers: [CommonCartridgeController],
})
export class CommonCartridgeApiModule {}
