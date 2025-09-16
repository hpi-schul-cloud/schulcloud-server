import { Module } from '@nestjs/common';
import { CommonCartridgeImportService } from './service/common-cartridge-import.service';
import { CourseModule } from '@modules/course';
import { BoardModule } from '@modules/board';
import { AuthorizationModule } from '@modules/authorization';
import { CommonCartridgeImportMappper } from './mapper/common-cartridge-import.mapper';
import { LoggerModule } from '@core/logger';

@Module({
	imports: [CourseModule, BoardModule, AuthorizationModule, LoggerModule],
	controllers: [],
	providers: [CommonCartridgeImportService, CommonCartridgeImportMappper],
	exports: [CommonCartridgeImportService],
})
export class CommonCartridgeSvsModule {}
