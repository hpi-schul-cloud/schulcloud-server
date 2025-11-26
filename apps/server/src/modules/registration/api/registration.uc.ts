import { MailService } from '@infra/mail';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoomMembershipService } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Registration, RegistrationService } from '../domain';
import { CreateOrUpdateRegistrationBodyParams } from './dto/request/create-registration.body.params';
import { RegistrationFeatureService } from './service';

@Injectable()
export class RegistrationUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mailService: MailService,
		private readonly registrationService: RegistrationService,
		private readonly registrationFeatureService: RegistrationFeatureService,
		private readonly roomMembershipService: RoomMembershipService
	) {}

	public async createOrUpdateRegistration(
		userId: EntityId,
		props: CreateOrUpdateRegistrationBodyParams
	): Promise<Registration> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(props.roomId);
		this.authorizationService.checkPermission(user, roomMembershipAuthorizable, AuthorizationContextBuilder.write([]));

		const existingRegistration = await this.registrationService.fetchAndUpdateRegistrationByEmail(props);
		if (existingRegistration) {
			// TODO klären mit Anna
			return existingRegistration;
		}

		const registration = await this.registrationService.createOrUpdateRegistration({ ...props });
		const registrationMail = this.registrationService.generateRegistrationMail(
			registration.email,
			registration.firstName,
			registration.lastName,
			registration.registrationSecret
		);
		await this.mailService.send(registrationMail);
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
}
