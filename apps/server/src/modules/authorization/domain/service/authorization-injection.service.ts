import { User } from '@modules/user/repo';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AuthorizableReferenceType, AuthorizationLoaderService, Rule } from '../type';

export interface CurrentUserLoader {
	loadCurrentUserWithPermissions(userId: EntityId): Promise<User>;
}

@Injectable()
export class AuthorizationInjectionService {
	private readonly authorizationRules: Rule[] = [];

	private readonly referenceLoaders: Map<AuthorizableReferenceType, AuthorizationLoaderService> = new Map();

	private currentUserLoader?: CurrentUserLoader;

	public injectAuthorizationRule(rule: Rule): void {
		this.authorizationRules.push(rule);
	}

	public getAuthorizationRules(): Rule[] {
		return this.authorizationRules;
	}

	public injectReferenceLoader(
		referenceType: AuthorizableReferenceType,
		referenceLoader: AuthorizationLoaderService
	): void {
		this.referenceLoaders.set(referenceType, referenceLoader);
	}

	public getReferenceLoader(referenceType: AuthorizableReferenceType): AuthorizationLoaderService | undefined {
		return this.referenceLoaders.get(referenceType);
	}

	public injectUserLoader(userLoader: CurrentUserLoader): void {
		this.currentUserLoader = userLoader;
	}

	public getCurrentUserLoader(): CurrentUserLoader {
		if (!this.currentUserLoader) {
			throw new InternalServerErrorException('UserLoader is not injected');
		}

		return this.currentUserLoader;
	}
}
