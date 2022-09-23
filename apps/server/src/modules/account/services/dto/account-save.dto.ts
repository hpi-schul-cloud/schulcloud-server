import { IsOptional, Matches } from 'class-validator';
import { passwordPattern } from '../../controller/dto/password-pattern';
import { AccountBaseDto } from './account-base.dto';

export class AccountSaveDto extends AccountBaseDto {
	@IsOptional()
	@Matches(passwordPattern)
	newCleartextPassword?: string;
}
