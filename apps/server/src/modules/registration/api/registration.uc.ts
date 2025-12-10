import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoomMembershipService } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Registration, RegistrationService } from '../domain';
import { CreateOrUpdateRegistrationBodyParams } from './dto/request/create-registration.body.params';
import { RegistrationFeatureService } from './service';

@Injectable()
export class RegistrationUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
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

		const registration = await this.registrationService.createOrUpdateRegistration({ ...props });
		await this.registrationService.sendRegistrationMail(registration);

		return registration;
	}

	public async getSingleRegistrationBySecret(registrationSecret: string): Promise<Registration> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const registration = await this.registrationService.getSingleRegistrationBySecret(registrationSecret);

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

	public async completeRegistration(
		registrationSecret: string,
		language: LanguageType,
		password: string
	): Promise<void> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const registration = await this.registrationService.getSingleRegistrationBySecret(registrationSecret);

		await this.registrationService.completeRegistration(registration, language, password);
	}
}
