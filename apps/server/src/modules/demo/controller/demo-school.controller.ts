import { Controller, ForbiddenException, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CreationProtocol } from '../types';
import { DemoSchoolUc } from '../uc';
import { DemoSchoolResponse } from './dto';

@ApiTags('Demo School')
@Authenticate('jwt')
@Controller('demo-schools')
export class DemoSchoolController {
	constructor(private readonly demoSchoolUc: DemoSchoolUc) {}

	@ApiOperation({ summary: 'Create a demo school.' })
	@ApiResponse({ status: 200, type: DemoSchoolResponse })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Post()
	async createDemoSchool(@CurrentUser() currentUser: ICurrentUser): Promise<CreationProtocol[]> {
		const protocol = await this.demoSchoolUc.createSchool(currentUser.userId);
		// const response = new DemoSchoolResponse(school); // WIP: do a proper mapping

		return protocol;
	}
}
