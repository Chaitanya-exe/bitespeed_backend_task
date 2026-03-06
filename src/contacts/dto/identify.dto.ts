import {IsString, IsOptional} from 'class-validator'; 

export class IdentifyDto {
    @IsString()
    @IsOptional()
    email?:string

    @IsOptional()
    @IsString()
    phoneNumber?:string

}