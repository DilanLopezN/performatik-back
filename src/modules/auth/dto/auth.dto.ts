import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

// ================================
// Register
// ================================
export class RegisterDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'America/Sao_Paulo',
    description: 'Timezone do usuário (IANA)',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}

// ================================
// Login
// ================================
export class LoginDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  password: string;
}

// ================================
// Refresh Token
// ================================
export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token para renovar access token' })
  @IsString()
  refreshToken: string;
}

// ================================
// Responses
// ================================
export class TokensResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token' })
  refreshToken: string;

  @ApiProperty({ description: 'Tempo de expiração do access token em segundos' })
  expiresIn: number;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ nullable: true })
  weightKg: number | null;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokensResponseDto })
  tokens: TokensResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;
}
