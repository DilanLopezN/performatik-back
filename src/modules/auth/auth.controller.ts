import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  TokensResponseDto,
  UserResponseDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, CurrentUserData } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registrar novo usuário
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async register(@Body() dto: RegisterDto): Promise<{ data: AuthResponseDto }> {
    const result = await this.authService.register(dto);
    return { data: result };
  }

  /**
   * Login de usuário
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto): Promise<{ data: AuthResponseDto }> {
    const result = await this.authService.login(dto);
    return { data: result };
  }

  /**
   * Renovar tokens
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    type: TokensResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<{ data: TokensResponseDto }> {
    const result = await this.authService.refreshTokens(dto.refreshToken);
    return { data: result };
  }

  /**
   * Obter perfil do usuário autenticado
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProfile(@CurrentUser() user: CurrentUserData): Promise<{ data: UserResponseDto }> {
    const result = await this.authService.getProfile(user.id);
    return { data: result };
  }
}
