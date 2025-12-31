import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  TokensResponseDto,
  AuthResponseDto,
  UserResponseDto,
} from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: StringValue | number;
  private readonly refreshTokenExpiry: StringValue | number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = this.configService.get<string>('auth.jwtSecret');
    if (!jwtSecret) {
      // Falhar cedo para não rodar com secret undefined
      throw new Error('Missing auth.jwtSecret in configuration');
    }

    this.jwtSecret = jwtSecret;

    // Tipagem compatível com JwtSignOptions.expiresIn (number | StringValue)
    // Defaults seguros
    this.accessTokenExpiry =
      (this.configService.get<string>(
        'auth.accessTokenExpiry',
      ) as StringValue) ?? '15m';

    this.refreshTokenExpiry =
      (this.configService.get<string>(
        'auth.refreshTokenExpiry',
      ) as StringValue) ?? '7d';
  }

  /**
   * Registrar novo usuário
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        timezone: dto.timezone || 'America/Sao_Paulo',
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        weightKg: true,
        createdAt: true,
      },
    });

    this.logger.log(`Novo usuário registrado: ${user.id}`);

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Login de usuário
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`Login realizado: ${user.id}`);

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  /**
   * Renovar tokens usando refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokensResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.jwtSecret,
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      this.logger.warn('Tentativa de refresh com token inválido');
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  /**
   * Obter perfil do usuário autenticado
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        weightKg: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return this.formatUserResponse(user);
  }

  // ================================
  // Métodos privados
  // ================================

  /**
   * Hash de senha com bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verificar senha com bcrypt
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Gerar par de tokens (access + refresh)
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<TokensResponseDto> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.jwtSecret,
        expiresIn: this.accessTokenExpiry,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.jwtSecret,
        expiresIn: this.refreshTokenExpiry,
      }),
    ]);

    // Se accessTokenExpiry for número (segundos), use direto; se for string, converte.
    const expiresIn =
      typeof this.accessTokenExpiry === 'number'
        ? this.accessTokenExpiry
        : this.parseExpiryToSeconds(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Converter string de expiração para segundos
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 min

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  /**
   * Formatar resposta do usuário (converter Decimal para number)
   */
  private formatUserResponse(user: {
    id: string;
    email: string;
    name: string;
    timezone: string;
    weightKg: unknown;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      weightKg: user.weightKg ? Number(user.weightKg) : null,
      createdAt: user.createdAt,
    };
  }
}
