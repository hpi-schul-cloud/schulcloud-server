import { Injectable } from '@nestjs/common';
import { AuthorizableReferenceType, AuthorizationLoaderService, Rule } from '../type';

@Injectable()
export class AuthorizationInjectionService {
	private readonly authorizationRules: Rule[] = [];

	private readonly referenceLoaders: Map<AuthorizableReferenceType, AuthorizationLoaderService> = new Map();

	private readonly doPopulate: Map<AuthorizableReferenceType, boolean> = new Map();

	// constructor() {}

	injectAuthorizationRule(rule: Rule) {
		this.authorizationRules.push(rule);
	}

	getAuthorizationRules(): Rule[] {
		return this.authorizationRules;
	}

	injectReferenceLoader(
		referenceType: AuthorizableReferenceType,
		referenceLoader: AuthorizationLoaderService,
		doPopulate = false
	) {
		this.referenceLoaders.set(referenceType, referenceLoader);
		this.doPopulate.set(referenceType, doPopulate);
	}

	getReferenceLoader(referenceType: AuthorizableReferenceType): AuthorizationLoaderService | undefined {
		return this.referenceLoaders.get(referenceType);
	}

	shouldPopulate(referenceType: AuthorizableReferenceType): boolean {
		return this.doPopulate.get(referenceType) ?? false;
	}
}
