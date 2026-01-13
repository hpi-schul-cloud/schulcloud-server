import { CoreModule } from '@core/core.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { AuthGuardModule, AuthGuardOptions, JwtAuthGuardConfig } from '@infra/auth-guard';
import { AuthorizationClientModule } from '@infra/authorization-client';
import { ValkeyClientModule, ValkeyConfig } from '@infra/valkey-client';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication/authentication-config';
import { User } from '@modules/user/repo';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { defaultMikroOrmOptions } from '@shared/common/defaultMikroOrmOptions';
import { authorizationClientConfig, config } from './common-cartridge.config';
import { CommonCartridgeModule } from './common-cartridge.module';
import { CommonCartridgeController } from './controller/common-cartridge.controller';

const createValkeyModuleOptions = (configService: ConfigService<JwtAuthGuardConfig>): ValkeyConfig => {
	const config = {
		MODE: configService.getOrThrow('SESSION_VALKEY__MODE', { infer: true }),
		URI: configService.get('SESSION_VALKEY__URI', { infer: true }),
		SENTINEL_NAME: configService.get('SESSION_VALKEY__SENTINEL_NAME', { infer: true }),
		SENTINEL_PASSWORD: configService.get('SESSION_VALKEY__SENTINEL_PASSWORD', { infer: true }),
		SENTINEL_SERVICE_NAME: configService.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME', { infer: true }),
	};

	return config;
};
@Module({
	imports: [
		CoreModule,
		HttpModule,
		AuthorizationClientModule.register(authorizationClientConfig),
		AuthGuardModule.register([AuthGuardOptions.JWT]),
		ValkeyClientModule.registerAsync({
			injectionToken: SESSION_VALKEY_CLIENT,
			useFactory: createValkeyModuleOptions,
			inject: [ConfigService],
		}),
		ConfigModule.forRoot(createConfigModuleOptions(config)),
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
