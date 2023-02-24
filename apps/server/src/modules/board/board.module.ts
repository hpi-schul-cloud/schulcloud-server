import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { BoardManagementConsole } from './console/board-management.console';
import { BoardManagementUc } from './uc/board-management.uc';

@Module({
	imports: [ConsoleWriterModule],
	controllers: [],
	providers: [BoardManagementConsole, BoardManagementUc],
	exports: [],
})
export class BoardModule {}
