import { IsOptional, Matches } from 'class-validator';
import { passwordPattern } from '../../controller/dto/password-pattern';
import { AccountBaseDto } from './account-base.dto';

export class AccountSaveDto extends AccountBaseDto {
	@IsOptional()
	@Matches(passwordPattern)
	newCleartextPassword?: string;

	constructor(props: AccountSaveDto | AccountBaseDto) {
		super(props);
		if (props instanceof AccountSaveDto) {
			this.newCleartextPassword = props.newCleartextPassword;
		}
	}
}
