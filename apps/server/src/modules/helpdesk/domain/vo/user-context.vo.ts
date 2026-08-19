import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsArray, IsMongoId, IsString } from 'class-validator';
import { UserContextProps } from '..';

@ValueObject()
export class UserContext implements UserContextProps {
	@IsMongoId()
	public readonly userId: string;

	@IsString()
	public readonly userName: string;

	@IsString()
	public readonly userEmail: string;

	@IsArray()
	@IsString({ each: true })
	public readonly userRoles: string[];

	@IsMongoId()
	public readonly schoolId: string;

	@IsString()
	public readonly schoolName: string;

	@IsString()
	public readonly instanceName: string;

	constructor(props: UserContextProps) {
		this.userId = props.userId;
		this.userName = props.userName;
		this.userEmail = props.userEmail;
		this.userRoles = props.userRoles;
		this.schoolId = props.schoolId;
		this.schoolName = props.schoolName;
		this.instanceName = props.instanceName;
	}
}
