import { Controller } from '@nestjs/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';

import { H5PLibraryManegementUc } from '../uc/h5p-library-management.uc';

@Authenticate('jwt')
@Controller('h5p-library-management')
export class H5PLibraryManagementController {
	constructor(private h5pLibraryManegementUc: H5PLibraryManegementUc) {}
}
