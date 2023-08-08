import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../../authorization';
import { ToolPermissionHelper } from './uc/tool-permission-helper';

@Module({
	imports: [AuthorizationModule],
	providers: [ToolPermissionHelper],
	exports: [ToolPermissionHelper],
})
export class ToolPermissionHelperModule {}
