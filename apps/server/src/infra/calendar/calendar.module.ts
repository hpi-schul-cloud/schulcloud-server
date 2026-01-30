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
	public static register(injectionToken: string, Constructor: new () => CalendarConfig): DynamicModule {
		return {
			module: CalendarModule,
			imports: [HttpModule, CqrsModule, LoggerModule, ConfigurationModule.register(injectionToken, Constructor)],
			providers: [CalendarMapper, CalendarService],
			exports: [CalendarService],
		};
	}
}
