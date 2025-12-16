import { Module } from '@nestjs/common';
import { RuntimeConfigController } from './api/runtime-config.controller';
import { RuntimeConfigUc } from './api/runtime-config.uc';
import { ServerRuntimeConfigModule } from './server-runtime-config.module';
import { AuthorizationModule } from '@modules/authorization';

@Module({
	controllers: [RuntimeConfigController],
	imports: [ServerRuntimeConfigModule, AuthorizationModule],
	providers: [RuntimeConfigUc],
	exports: [],
})
export class RuntimeConfigApiModule {}
