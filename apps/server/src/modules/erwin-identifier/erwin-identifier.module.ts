import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { ERWIN_IDENTIFIER_REPO } from './domain/interface';
import { ErwinIdentifierService } from './domain/service';
import { ErwinIdentifierMikroOrmRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [
		ErwinIdentifierService,
		ErwinIdentifierMikroOrmRepo,
		{ provide: ERWIN_IDENTIFIER_REPO, useClass: ErwinIdentifierMikroOrmRepo },
	],
	exports: [ErwinIdentifierService],
})
export class ErwinIdentifierModule {}
