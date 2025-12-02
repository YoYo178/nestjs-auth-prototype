import { IsAlphanumeric, IsEmail, isEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";


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

export class SigninDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}