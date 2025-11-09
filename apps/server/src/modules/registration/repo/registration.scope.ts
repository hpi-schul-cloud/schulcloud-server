import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { RegistrationEntity } from './entity';

export class RegistrationScope extends Scope<RegistrationEntity> {
	byRegistrationHash(hash?: string): this {
		if (hash) {
			this.addQuery({ registrationHash: hash });
		}

		return this;
	}

	byRoomId(roomId?: EntityId): this {
		if (roomId) {
			this.addQuery({ roomIds: { $in: [roomId] } });
		}

		return this;
	}
}
