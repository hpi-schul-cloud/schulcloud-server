import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { BoardModule } from './board.module';
import { BoardController, CardController, ColumnController, ElementController } from './controller';
import { BoardUc, CardUc } from './uc';
import { ElementUc } from './uc/element.uc';

@Module({
	imports: [BoardModule, LoggerModule, AuthorizationModule],
	controllers: [BoardController, ColumnController, CardController, ElementController],
	providers: [BoardUc, CardUc, ElementUc],
})
export class BoardApiModule {}
