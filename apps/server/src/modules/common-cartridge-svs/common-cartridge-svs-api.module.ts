import { Module } from '@nestjs/common';
import { CommonCartridgeImportController } from './contorller/common-cartridge.controller';
import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization-reference';
import { CommonCartridgeImportUc } from './uc/common-cartridge-import.uc';
import { CommonCartridgeSvsModule } from './common-cartridge-svs.module';

@Module({
	imports: [CommonCartridgeSvsModule, AuthorizationModule, AuthorizationReferenceModule],
	controllers: [CommonCartridgeImportController],
	providers: [CommonCartridgeImportUc],
})
export class CommonCartridgeSvsApiModule {}
