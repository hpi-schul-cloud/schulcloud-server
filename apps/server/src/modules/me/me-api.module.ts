import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { MeController, MeUc } from './api';

@Module({
	imports: [SchoolModule, UserModule],
	controllers: [MeController],
	providers: [MeUc],
})
export class MeApiModule {}
