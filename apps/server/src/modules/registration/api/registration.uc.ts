import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoomMembershipService } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Registration, RegistrationService } from '../domain';
import { CreateRegistrationBodyParams } from './dto/request/create-registration.body.params';
import { RegistrationFeatureService } from './service';

@Injectable()
export class RegistrationUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly registrationService: RegistrationService,
		private readonly registrationFeatureService: RegistrationFeatureService,
		private readonly roomMembershipService: RoomMembershipService
	) {}

	public async createRegistration(userId: EntityId, props: CreateRegistrationBodyParams): Promise<Registration> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(props.roomId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, AuthorizationContextBuilder.write([]));

		const existingRegistration = await this.fetchAndUpdateRegistrationByEmail(props);
		if (existingRegistration) {
			return existingRegistration;
		}

		const registration = await this.registrationService.createRegistration({ ...props });
		return registration;
	}

	public async getSingleRegistrationByHash(registrationHash: string): Promise<Registration> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const registration = await this.registrationService.getSingleRegistrationByHash(registrationHash);

		return registration;
	}

	public async getRegistrationsByRoomId(userId: EntityId, roomId: EntityId): Promise<Registration[]> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, AuthorizationContextBuilder.write([]));

		const registrations = await this.registrationService.getRegistrationsByRoomId(roomId);

		return registrations;
	}

	private async fetchAndUpdateRegistrationByEmail(props: CreateRegistrationBodyParams): Promise<Registration | null> {
		const existingRegistration = await this.registrationService.getSingleRegistrationByEmail(props.email);
		if (existingRegistration) {
			existingRegistration.firstName = props.firstName;
			existingRegistration.lastName = props.lastName;
			existingRegistration.addRoomId(props.roomId);
			await this.registrationService.saveRegistration(existingRegistration);
			return existingRegistration;
		}
		return null;
	}
}
