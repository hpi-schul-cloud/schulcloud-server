import { MethodNotAllowedException } from '@nestjs/common';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { BuildOptions, DeepPartial } from 'fishery';
import { BaseFactory } from '../base.factory';

export class DomainObjectFactory<
	T extends DomainObject<U>,
	U extends AuthorizableObject = T extends DomainObject<infer X> ? X : never,
	I = unknown,
	C = U,
> extends BaseFactory<T, U, I, C> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override buildWithId(params?: DeepPartial<U>, id?: string, options: BuildOptions<U, I> = {}): T {
		throw new MethodNotAllowedException(
			'Domain Objects are always generated with an id. Use .build({ id: ... }) to set an id.'
		);
	}
}
