import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { ElementUc, SubElementUc } from '../uc';

@ApiTags('Board submissions')
@Authenticate('jwt')
@Controller('elements/submissions')
export class SubmissionBoardController {
	constructor(private readonly elementUc: ElementUc, private readonly subElementUc: SubElementUc) {}
}
