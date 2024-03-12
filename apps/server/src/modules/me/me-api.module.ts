import { AuthenticationModule } from '@modules/authentication';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { MeController, MeUc } from './api';

@Module({
	imports: [SchoolModule, UserModule, AuthenticationModule],
	controllers: [MeController],
	providers: [MeUc],
})
export class MeApiModule {}
