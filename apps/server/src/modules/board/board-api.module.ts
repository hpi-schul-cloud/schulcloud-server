import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from './board.module';
import { BoardController } from './controller/board.controller';
import { CardController } from './controller/card.controller';
import { BoardUc, CardUc } from './uc';

@Module({
	imports: [BoardModule, LoggerModule],
	controllers: [BoardController, CardController],
	providers: [BoardUc, CardUc],
})
export class BoardApiModule {}
