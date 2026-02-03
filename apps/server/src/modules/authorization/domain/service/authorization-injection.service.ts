import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthorizableReferenceType, AuthorizationLoaderService, CurrentUserLoader, Rule } from '../type';

@Injectable()
export class AuthorizationInjectionService {
	private readonly authorizationRules: Rule[] = [];

	private readonly referenceLoaders: Map<AuthorizableReferenceType, AuthorizationLoaderService> = new Map();

	private currentUserLoader?: CurrentUserLoader;

	public injectAuthorizationRule(rule: Rule): void {
		const ruleConstructor = rule.constructor.name;
		const exists = this.authorizationRules.some((rule) => rule.constructor.name === ruleConstructor);
		if (!exists) {
			this.authorizationRules.push(rule);
		}
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

	public injectCurrentUserLoader(userLoader: CurrentUserLoader): void {
		this.currentUserLoader = userLoader;
	}

	public getCurrentUserLoader(): CurrentUserLoader {
		if (!this.currentUserLoader) {
			throw new InternalServerErrorException('UserLoader is not injected');
		}

		return this.currentUserLoader;
	}
}
