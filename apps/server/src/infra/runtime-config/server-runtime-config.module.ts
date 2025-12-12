import { Module } from '@nestjs/common';
import { RuntimeConfigModule } from './runtime-config.module';
import RuntimeConfigDefaults from './runtime-config-defaults';

@Module({
	imports: [
		RuntimeConfigModule.forRoot({
			defaults: RuntimeConfigDefaults,
		}),
	],
	exports: [RuntimeConfigModule],
})
export class ServerRuntimeConfigModule {}
