import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Registration } from '../domain/do/registration.do';
import { RegistrationDomainMapper } from './registration-domain.mapper';
import { RegistrationEntity } from './entity';
import { RegistrationScope } from './registration.scope';

@Injectable()
export class RegistrationRepo {
	constructor(private readonly em: EntityManager) {}

	public async save(registration: Registration | Registration[]): Promise<void> {
		const registrations = Utils.asArray(registration);

		registrations.forEach((r) => {
			const entity = RegistrationDomainMapper.mapDoToEntity(r);
			this.em.persist(entity);
		});

		await this.flush();
	}

	public async findById(registrationId: string): Promise<Registration> {
		const entity = await this.em.findOneOrFail(RegistrationEntity, {
			id: registrationId,
		});
		const domainObject = RegistrationDomainMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findByHash(hash: string): Promise<Registration> {
		const entity = await this.em.findOneOrFail(RegistrationEntity, { registrationHash: hash });
		const domainObject = RegistrationDomainMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findByRoomId(roomId: string): Promise<Registration[]> {
		const scope = new RegistrationScope();
		scope.byRoomId(roomId);

		const entities = await this.em.find(RegistrationEntity, scope.query);
		const domainObjects = entities.map((entity) => RegistrationDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	private async flush(): Promise<void> {
		return this.em.flush();
	}
}
