import { CourseModule } from '@modules/course';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { BoardModule } from '../board/board.module';
import { LegacySchoolModule } from '../legacy-school';
import { RoomModule } from '../room';
import { BoardContextApiHelperService } from './board-context-api-helper.service';

@Module({
	imports: [BoardModule, CourseModule, RoomModule, LegacySchoolModule, UserModule],
	providers: [BoardContextApiHelperService],
	exports: [BoardContextApiHelperService],
})
export class BoardContextModule {}
