import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoomMembershipService } from '@modules/room-membership';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { LanguageType, Permission } from '@shared/domain/interface';
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
		await this.checkPermissions(userId, props.roomId);

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
		await this.checkPermissions(userId, roomId);

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

	public async cancelRegistrationsForRoom(
		userId: EntityId,
		registrationIds: Array<EntityId>,
		roomId: EntityId
	): Promise<Registration[] | null> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();
		await this.checkPermissions(userId, roomId);

		const updatedRegistrations = await this.registrationService.cancelRegistrationsForRoom(registrationIds, roomId);

		return updatedRegistrations;
	}

	public async resendRegistrationMails(
		userId: EntityId,
		registrationIds: Array<EntityId>,
		roomId: EntityId
	): Promise<Registration[] | null> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		this.authorizationService.checkPermission(
			user,
			roomAuthorizable,
			AuthorizationContextBuilder.write([Permission.ROOM_ADD_MEMBERS])
		);

		const resentRegistrations = await this.registrationService.resendRegistrationMails(registrationIds);

		return resentRegistrations;
	}

	private async checkPermissions(userId: EntityId, roomId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const hasRoomPermission = this.authorizationService.hasPermission(
			user,
			roomAuthorizable,
			AuthorizationContextBuilder.write([Permission.ROOM_ADD_MEMBERS])
		);
		const hasRegistrationManagementPersmission = this.authorizationService.hasAllPermissions(user, [
			Permission.SCHOOL_MANAGE_ROOM_INVITATIONLINKS,
		]);

		if (!hasRoomPermission || !hasRegistrationManagementPersmission) {
			throw new ForbiddenException('User does not have permission for this action.');
		}
	}
}
