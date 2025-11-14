import { Registration } from '../../domain/do/registration.do';
import { RegistrationItemResponse } from '../dto/response/registration-item.response';
import { RegistrationListResponse } from '../dto/response/registration-list.response';

export class RegistrationMapper {
	public static mapToRegistrationItemResponse(registration: Registration): RegistrationItemResponse {
		const response = new RegistrationItemResponse({
			id: registration.id,
			email: registration.email,
			firstName: registration.firstName,
			lastName: registration.lastName,
			password: registration.password,
			consent: registration.consent,
			language: registration.language,
			roomIds: registration.roomIds?.map((id) => id.toString()) ?? [],
			registrationHash: registration.registrationHash,
			createdAt: registration.createdAt,
			updatedAt: registration.updatedAt,
		});

		return response;
	}

	public static mapToRegistrationListResponse(registrations: Registration[]): RegistrationListResponse {
		const mappedRegistrations = registrations.map((registration) => this.mapToRegistrationItemResponse(registration));

		const response = new RegistrationListResponse({ data: mappedRegistrations });
		return response;
	}
}
