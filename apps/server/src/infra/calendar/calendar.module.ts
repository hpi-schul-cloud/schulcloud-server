import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CalendarConfig } from './calendar.config';
import { CalendarMapper } from './mapper/calendar.mapper';
import { CalendarService } from './service/calendar.service';

@Module({})
export class CalendarModule {
	public static register(configInjectionToken: string, configConstructor: new () => CalendarConfig): DynamicModule {
		return {
			module: CalendarModule,
			imports: [
				HttpModule,
				CqrsModule,
				LoggerModule,
				ConfigurationModule.register(configInjectionToken, configConstructor),
			],
			providers: [CalendarMapper, CalendarService],
			exports: [CalendarService],
		};
	}
}
