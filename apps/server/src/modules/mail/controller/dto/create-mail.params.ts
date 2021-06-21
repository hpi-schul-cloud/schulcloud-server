import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsEmail, ValidateNested, IsArray, IsBase64, IsMimeType, IsOptional } from 'class-validator';

class MailAttachment {
    @IsBase64()
    @ApiProperty({
        description: 'attachment content encoded as base64'
    })
    base64Content: string;

    @IsMimeType()
    @ApiProperty({
        description: 'MIME type of the attachment'
    })
    mimeType: string;

    @IsString()
    @ApiProperty({
        description: 'file name of the attachment'
    })
    name: string;

    // ToDo: enum
    @IsString()
    @ApiProperty({
        description: 'disposition of the attachment content'
    })
    contentDisposition: string;

    // ToDo: id
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'identifier for the attachment'
    })
    contentId?: string;
}

class MailContent {
    @IsString()
    @ApiProperty({
        description: 'subject of the mail'
    })
    subject: string;

    @IsString()
    @ApiProperty({
        description: 'mail content in HTML'
    })
    htmlContent: string;

    @IsString()
    @ApiProperty({
        description: 'mail content in plain text'
    })
    plainTextContent: string;

    @ValidateNested({each: true})
    @Type(() => MailAttachment)
    attachments: MailAttachment[];
};

export class CreateMailParams {
    @ValidateNested()
    @Type(() => MailContent)
    mail: MailContent;

    @IsArray()
    @ApiProperty({
        description: 'list of email recipients'
    })
    recipients: string[];

    @IsOptional()
    @IsEmail()
    @ApiProperty({
        description: 'email address of the sender',
    })
    from?: string;

    @IsOptional()
    @IsArray()
    @ApiProperty({
        description: 'list of email recipients in cc'
    })
    cc?: string[]

    @IsOptional()
    @IsArray()
    @ApiProperty({
        description: 'list of email recipients in bcc'
    })
    bcc?: string[]
}