import { DynamicModule, Module } from '@nestjs/common';
import { RuntimeConfigDefault } from './domain/runtime-config-value.do';
import { RuntimeConfigMikroOrmRepo } from './repo/runtime-config.repo';
import { RuntimeConfigService } from './domain/runtime-config.service';
import { RUNTIME_CONFIG_DEFAULTS, RUNTIME_CONFIG_REPO } from './injection-keys';

interface RuntimeConfigModuleOptions {
	defaults: RuntimeConfigDefault[];
}

@Module({})
export class RuntimeConfigModule {
	public static forRoot(options: RuntimeConfigModuleOptions): DynamicModule {
		return {
			module: RuntimeConfigModule,
			providers: [
				RuntimeConfigService,
				{
					provide: RUNTIME_CONFIG_DEFAULTS,
					useValue: options.defaults,
				},
				{
					provide: RUNTIME_CONFIG_REPO,
					useClass: RuntimeConfigMikroOrmRepo,
				},
			],
			exports: [RuntimeConfigService],
		};
	}
}
