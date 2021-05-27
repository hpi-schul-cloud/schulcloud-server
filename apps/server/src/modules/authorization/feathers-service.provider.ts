import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { EntityId } from '@shared/domain';

// Provides an interface to access feathers services
// Use only to gain access to feathers services.
// IMPORTANT: Introduce strict typing in NestJs services
@Injectable({ scope: Scope.REQUEST })
export class FeathersServiceProvider {
	constructor(@Inject(REQUEST) private request: Request) {}

	async get(path: string, id: EntityId, params?: any): Promise<any | null> {
		// TODO take existing request params (auth)
		const response = await (this.request.app as any).service(path).get(id, params);
		return response;
	}

	// TODO throw exception
	async find(path: string, params?: any): Promise<any | null> {
		const service = (this.request.app as any).service(path);
		// TODO take existing request params (auth)
		const response = await service.find(params);
		return response;
	}
}
