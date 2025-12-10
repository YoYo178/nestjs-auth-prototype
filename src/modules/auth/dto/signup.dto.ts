import { IsString, IsNotEmpty, IsEmail, Matches, IsAlphanumeric, MinLength } from "class-validator";

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
    @IsAlphanumeric()
    @MinLength(8)
    password: string;
}