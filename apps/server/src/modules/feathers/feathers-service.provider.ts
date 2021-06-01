import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Application } from '@feathersjs/express';
import { EntityId } from '@shared/domain';

export interface FeathersService {
	/**
	 *
	 * @param id
	 * @param params
	 * @deprecated Access legacy eathers service get method
	 */
	get(id: EntityId, params?: FeathersServiceParams): Promise<FeathersServiceResponse>;
	/**
	 *
	 * @param params
	 * @deprecated Access legacy eathers service find method
	 */
	find(params?: FeathersServiceParams): Promise<FeathersServiceResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeathersServiceParams = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeathersServiceResponse = Record<string, any> | any[];

/**
 * This Service gives access to legacy feathers services. It is request based injected.
 * IMPORTANT: Introduce strong typing immediately when using this modules service.
 */
@Injectable({ scope: Scope.REQUEST })
export class FeathersServiceProvider {
	constructor(@Inject(REQUEST) private request: Request) {}

	getService(path: string): FeathersService {
		const service = (this.request.app as Application).service(path) as FeathersService;
		return service;
	}
}
