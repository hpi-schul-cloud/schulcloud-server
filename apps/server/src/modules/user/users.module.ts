import { Module } from '@nestjs/common';
import { UsersController } from './controller/users.controller';
import { UsersService } from './users.service';

@Module({
	providers: [UsersService],
	exports: [UsersService],
	controllers: [
		/*UsersController*/
	],
})
export class UsersModule {}
