import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '../board';
import { LearnroomModule } from '../learnroom';
import { AncestorListController } from './controller/ancestor-list.controller';
import { AncestorListResolverService } from './service/ancestor-list-resolver.service';

@Module({
	imports: [ConsoleWriterModule, LoggerModule, BoardModule, LearnroomModule],
	controllers: [AncestorListController],
	providers: [AncestorListResolverService],
	exports: [AncestorListResolverService],
})
export class AncestorListModule {}
