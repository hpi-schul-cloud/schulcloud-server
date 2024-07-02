import { Module } from '@nestjs/common';
import { FilesStorageModule } from '../files-storage/files-storage.module';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [FilesStorageModule],
	providers: [CommonCartridgeUc, CommonCartridgeExportService],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
