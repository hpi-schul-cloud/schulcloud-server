import { Module } from '@nestjs/common';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';

@Module({
	imports: [],
	controllers: [ConsoleController],
	providers: [ConsoleService],
})
export class ConsoleModule {}
