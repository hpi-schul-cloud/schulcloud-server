import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CreateRegistrationBodyParams } from './dto/request/create-registration.body.params';
import { Registration, RegistrationService } from '../domain';
import { Action, AuthorizationService } from '@modules/authorization';
import { RegistrationFeatureService } from './service';
import { RoomService } from '@modules/room';
import { RoomPermissionService } from '@modules/room/api/service';
import { UpdateRegistrationBodyParams } from './dto/request/update-registration.body.params';

@Injectable()
export class RegistrationUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly registrationService: RegistrationService,
		private readonly registrationFeatureService: RegistrationFeatureService,
		private readonly roomService: RoomService,
		private readonly roomPermissionService: RoomPermissionService
	) {}

	public async createRegistration(userId: EntityId, props: CreateRegistrationBodyParams): Promise<Registration> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkOneOfPermissions(user, [Permission.USER_CREATE]);

		const registration = await this.registrationService.createRegistration({ ...props });
		return registration;
	}

	public async updateRegistration(registrationId: EntityId, updatedProps: UpdateRegistrationBodyParams) {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		// check if current user is correct for this registration ?
		const registration = await this.registrationService.getSingleRegistrationByRegistrationId(registrationId);

		const updatedRegistration = await this.registrationService.updateRegistration(registration, updatedProps);
		return updatedRegistration;
	}

	public async getSingleRegistrationByHash(registrationHash: string): Promise<Registration> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		const registration = await this.registrationService.getSingleRegistrationByHash(registrationHash);

		return registration;
	}

	public async getRegistrationsByRoomId(userId: EntityId, roomId: EntityId): Promise<Registration[]> {
		this.registrationFeatureService.checkFeatureRegistrationEnabled();

		await this.roomService.getSingleRoom(roomId);
		await this.roomPermissionService.checkRoomAuthorizationByIds(userId, roomId, Action.write);

		const registrations = await this.registrationService.getRegistrationsByRoomId(roomId);

		return registrations;
	}
}
