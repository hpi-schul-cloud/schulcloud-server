import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ErwinIdentifierService } from './domain/service';
import { ErwinIdentifierMikroOrmRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [ErwinIdentifierService, ErwinIdentifierMikroOrmRepo],
	exports: [ErwinIdentifierService],
})
export class ErwinIdentifierModule {}
