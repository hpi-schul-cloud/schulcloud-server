import { IsString } from 'class-validator';
import { SchulconnexCommunicationType } from './schulconnex-communication-type';

export class SanisErreichbarkeitenResponse {
	@IsString()
	typ!: SchulconnexCommunicationType;

	@IsString()
	kennung!: string;
}
