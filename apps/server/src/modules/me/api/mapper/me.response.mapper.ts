import { School } from '@src/modules/school';
import { Role, User } from '@shared/domain/entity';
import { MeResponse } from '../dto';

export class MeResponseMapper {
	public static mapToResponse(school: School, user: User, roles: Role[], permissions: string[]): MeResponse {
		const res = new MeResponse({
            permissions,
		});

		return res;
	}
}
