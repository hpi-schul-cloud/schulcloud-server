import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { RuntimeConfigController } from './api/runtime-config.controller';
import { RuntimeConfigUc } from './api/runtime-config.uc';
import { ServerRuntimeConfigModule } from './server-runtime-config.module';

@Module({
	controllers: [RuntimeConfigController],
	imports: [ServerRuntimeConfigModule, AuthorizationModule, LoggerModule],
	providers: [RuntimeConfigUc],
	exports: [],
})
export class RuntimeConfigApiModule {}
