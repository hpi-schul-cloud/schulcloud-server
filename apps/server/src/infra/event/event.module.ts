import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from '@src/core/logger';
import { EventService } from './event.service';

@Module({
	imports: [EventEmitterModule.forRoot(), LoggerModule],
	providers: [EventService],
	exports: [EventService],
})
export class EventModule {}
