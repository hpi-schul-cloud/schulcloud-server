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
			createdAt: registration.createdAt,
			updatedAt: registration.updatedAt,
			resentAt: registration.resentAt,
		});

		return response;
	}

	public static mapToRegistrationListResponse(registrations: Registration[]): RegistrationListResponse {
		const mappedRegistrations = registrations.map((registration) => this.mapToRegistrationItemResponse(registration));

		const response = new RegistrationListResponse({ data: mappedRegistrations });
		return response;
	}
}
