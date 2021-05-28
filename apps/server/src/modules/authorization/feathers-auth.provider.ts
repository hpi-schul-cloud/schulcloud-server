import { Injectable, Scope, Inject, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { BaseEntity, EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { Application } from '@feathersjs/express';
import { NewsTargetModelValue } from '../news/entity';

interface User {
	_id: ObjectId;
	schoolId: ObjectId;
	permissions: string[];
}

interface FeathersService {
	get(id: EntityId, params?: FeathersServiceParams): Promise<FeathersServiceResponse>;

	find(params?: FeathersServiceParams): Promise<FeathersServiceResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeathersServiceParams = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeathersServiceResponse = Record<string, any> | string[];

// Provides an interface to access feathers services
// Use only to gain access to feathers services.
// IMPORTANT: Introduce strict typing in NestJs services
@Injectable({ scope: Scope.REQUEST })
export class FeathersAuthProvider {
	constructor(@Inject(REQUEST) private request: Request) {}

	async getUserSchoolPermissions(userId: EntityId, schoolId: EntityId): Promise<string[]> | never {
		const user = await this.getUser(userId);
		// test user is school member
		const sameSchool = user.schoolId.equals(schoolId);
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	async getUserTargetPermissions(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		targetId: EntityId
	): Promise<string[]> {
		const service = this.getService(`${targetModel}/:scopeId/userPermissions/`);
		const targetPermissions = (await service.get(userId, {
			route: { scopeId: targetId },
		})) as string[];
		return targetPermissions;
	}

	async getPermittedTargets(
		userId: EntityId,
		targetModel: NewsTargetModelValue,
		permissions: string[]
	): Promise<EntityId[]> {
		const service = this.getService(`/users/:scopeId/${targetModel}`);
		const targets = (await service.find({
			route: { scopeId: userId.toString() },
			query: {
				permissions,
			},
			paginate: false,
		})) as BaseEntity[];
		const targetIds = targets.map((target) => target._id.toString());
		return targetIds;
	}

	async getPermittedSchools(userId: EntityId): Promise<EntityId[]> {
		const user = await this.getUser(userId);
		return [user.schoolId.toString()] as EntityId[];
	}

	private async getUser(userId: EntityId): Promise<User> {
		const service = this.getService('users');
		const user = (await service.get(userId)) as User;
		if (user == null) throw new NotFoundException();
		return user;
	}

	private getService(path: string): FeathersService {
		const service = (this.request.app as Application).service(path) as FeathersService;
		return service;
	}
}
