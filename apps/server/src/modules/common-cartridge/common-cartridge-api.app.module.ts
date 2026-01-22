import { CoreModule } from '@core/core.module';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '@modules/user/repo';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig } from './common-cartridge.config';
import { CommonCartridgeModule } from './common-cartridge.module';
import { CommonCartridgeController } from './controller/common-cartridge.controller';

const config = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('COMMON_CARTRIDGE__INCOMING_REQUEST_TIMEOUT_MS') as number,
};
@Module({
	imports: [
		CoreModule,
		HttpModule,
		AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		ConfigModule.forRoot(createConfigModuleOptions(() => config)),
		ConfigurationModule.register(COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig),
		CommonCartridgeModule,
		// Will remove this in the BC-8925
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: [User],
		}),
	],
	controllers: [CommonCartridgeController],
})
export class CommonCartridgeApiModule {}
