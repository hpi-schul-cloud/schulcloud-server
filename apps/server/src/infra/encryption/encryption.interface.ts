export const DefaultEncryptionService = Symbol('DefaultEncryptionService');
export const LdapEncryptionService = Symbol('LdapEncryptionService');

export interface EncryptionService {
	encrypt(data: string): string;
	decrypt(data: string): string;
}
