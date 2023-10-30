import { Module } from '@nestjs/common';
import { ContentElementFactory } from '@shared/domain/domainobject/board/content-element.factory';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { FilesStorageClientModule } from '../files-storage-client/files-storage-client.module';
import { UserModule } from '../user/user.module';
import { BoardDoRepo } from './repo/board-do.repo';
import { BoardNodeRepo } from './repo/board-node.repo';
import { RecursiveDeleteVisitor } from './repo/recursive-delete.vistor';
import { BoardDoAuthorizableService } from './service/board-do-authorizable.service';
import { BoardDoCopyService } from './service/board-do-copy-service/board-do-copy.service';
import { SchoolSpecificFileCopyServiceFactory } from './service/board-do-copy-service/school-specific-file-copy-service.factory';
import { BoardDoService } from './service/board-do.service';
import { CardService } from './service/card.service';
import { ColumnBoardCopyService } from './service/column-board-copy.service';
import { ColumnBoardService } from './service/column-board.service';
import { ColumnService } from './service/column.service';
import { ContentElementService } from './service/content-element.service';
import { OpenGraphProxyService } from './service/open-graph-proxy.service';
import { SubmissionItemService } from './service/submission-item.service';

@Module({
	imports: [ConsoleWriterModule, FilesStorageClientModule, LoggerModule, UserModule],
	providers: [
		BoardDoAuthorizableService,
		BoardDoRepo,
		BoardDoService,
		BoardNodeRepo,
		CardService,
		ColumnBoardService,
		ColumnService,
		ContentElementService,
		ContentElementFactory,
		CourseRepo, // TODO: import learnroom module instead. This is currently not possible due to dependency cycle with authorisation service
		RecursiveDeleteVisitor,
		SubmissionItemService,
		BoardDoCopyService,
		ColumnBoardCopyService,
		SchoolSpecificFileCopyServiceFactory,
		OpenGraphProxyService,
	],
	exports: [
		BoardDoAuthorizableService,
		CardService,
		ColumnBoardService,
		ColumnService,
		ContentElementService,
		SubmissionItemService,
		ColumnBoardCopyService,
	],
})
export class BoardModule {}
