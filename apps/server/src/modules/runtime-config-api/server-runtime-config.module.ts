import { RuntimeConfigModule } from '@infra/runtime-config/runtime-config.module';
import { Module } from '@nestjs/common';
import RuntimeConfigDefaults from 'config/runtime-config-defaults';

@Module({
	imports: [
		RuntimeConfigModule.forRoot({
			defaults: RuntimeConfigDefaults,
		}),
	],
	exports: [RuntimeConfigModule],
})
export class ServerRuntimeConfigModule {}
