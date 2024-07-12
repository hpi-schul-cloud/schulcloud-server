import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CommonCartridgeUc } from './uc/common-cartridge.uc';

@Module({
	imports: [FilesStorageClientModule],
	providers: [CommonCartridgeUc, CommonCartridgeExportService],
	exports: [CommonCartridgeUc],
})
export class CommonCartridgeModule {}
