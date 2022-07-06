import { CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';

export class VideoConferenceController {
	join(@CurrentUser() currentUser: ICurrentUser) {}
}
