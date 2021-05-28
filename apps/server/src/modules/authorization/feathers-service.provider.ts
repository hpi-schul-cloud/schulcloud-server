import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Application } from '@feathersjs/express';
import { EntityId } from '@shared/domain';

export interface FeathersService {
	get(id: EntityId, params?: FeathersServiceParams): Promise<FeathersServiceResponse>;

	find(params?: FeathersServiceParams): Promise<FeathersServiceResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeathersServiceParams = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeathersServiceResponse = Record<string, any> | any[];

// Provides an interface to access feathers services
// Use only to gain access to feathers services.
// IMPORTANT: Introduce strict typing in NestJs services
@Injectable({ scope: Scope.REQUEST })
export class FeathersServiceProvider {
	constructor(@Inject(REQUEST) private request: Request) {}

	getService(path: string): FeathersService {
		const service = (this.request.app as Application).service(path) as FeathersService;
		return service;
	}
}
