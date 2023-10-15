import { Module } from '@nestjs/common';
import { AuthorizationModule } from '..';
import { FederalStateController } from './controller/federal-state.controller';
import { FederalStateModule } from './federal-state.module';
import { FederalStateUC } from './uc/federal-state.uc';

@Module({
	imports: [FederalStateModule, AuthorizationModule],
	controllers: [FederalStateController],
	providers: [FederalStateUC],
})
export class FederalStateApiModule {}
