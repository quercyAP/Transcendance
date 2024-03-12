import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('access token missing');
    }
    try {
      const user = await this.authService.asyncVerifyToken(token);
      request['user'] = user;
    } catch (err) {
      throw new UnauthorizedException('access token invalid', err.message);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const headers: any = request.headers;
    const cookies = headers.cookie.split(';');
    if (!cookies) {
      return undefined;
    }
    const cookie = cookies.find((cookie) => cookie.includes('trans42_access'));
    if (!cookie) {
      return undefined;
    }
    const token = cookie.split('=')[1];
    return token;
  }
}

