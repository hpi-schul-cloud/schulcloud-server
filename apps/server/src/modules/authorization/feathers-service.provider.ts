import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Types } from 'mongoose';

@Injectable({ scope: Scope.REQUEST })
export class FeathersServiceProvider {
	constructor(@Inject(REQUEST) private request: Request) {}

	async get(path: string, id: Types.ObjectId, params?: any): Promise<any | null> {
		// TODO take existing request params (auth)
		const response = await (this.request.app as any).service(path).get(id, params);
		return response;
	}
}
