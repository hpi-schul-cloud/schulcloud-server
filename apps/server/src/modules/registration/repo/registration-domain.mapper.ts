import { Registration } from '../domain/do/registration.do';
import { RegistrationEntity } from './entity';

export class RegistrationDomainMapper {
	public static mapEntityToDo(registrationEntity: RegistrationEntity): Registration {
		// check identity map reference
		if (registrationEntity.domainObject) {
			return registrationEntity.domainObject;
		}

		const registration = new Registration(registrationEntity);

		// attach to identity map
		registrationEntity.domainObject = registration;

		return registration;
	}

	public static mapDoToEntity(registration: Registration): RegistrationEntity {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { props } = registration;

		if (!(props instanceof RegistrationEntity)) {
			const entity = new RegistrationEntity();
			Object.assign(entity, props);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			registration.props = entity;

			return entity;
		}

		return props;
	}
}
