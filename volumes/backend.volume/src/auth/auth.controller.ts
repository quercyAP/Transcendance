import {
  Controller,
  Get,
  HttpException,
  Post,
  Query,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './auth.decorator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('api/auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private readonly logger = new Logger(AuthController.name);

  @Public()
  @Post('signin')
  @ApiQuery({ name: 'code', required: true, description: '42 OAuth2 code' })
  @ApiQuery({
    name: 'url',
    required: true,
    description: '42 OAuth2 redirect url',
  })
  @ApiOperation({ description: 'Sign In User' })
  @ApiOkResponse({ description: 'Known User signed in' })
  @ApiCreatedResponse({ description: 'New User signed in' })
  async SignIn(
    @Query('code') code,
    @Query('url') url,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const ret = await this.authService.signIn(code, url);

      response.cookie('trans42_access', ret.access_token);
      if (ret.isNewUser) {
        response.status(HttpStatus.CREATED);
        return 'New User signed in';
      }
      response.status(HttpStatus.OK);
      return 'Known User signed in';
    } catch (err) {
      throw new HttpException(err.response.data, err.response.status);
    }
  }

  @Public()
  @Post('signinWithGithub')
  @ApiQuery({ name: 'code', required: true, description: 'GitHub OAuth2 code' })
  @ApiOperation({ description: 'Sign In User' })
  @ApiOkResponse({ description: 'Known User signed in' })
  @ApiCreatedResponse({ description: 'New User signed in' })
  async SignInWithGitHub(
    @Query('code') code,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const ret = await this.authService.signInWithGithub(code);
      response.cookie('trans42_access', ret.access_token);
      if (ret.isNewUser) {
        response.status(HttpStatus.CREATED);
        return 'New User signed in';
      }
      response.status(HttpStatus.OK);
      return 'Known User signed in';
    } catch (err) {
      if (err && err.response && err.response.data)
        throw new HttpException(err.response.data, err.response.status);
    }
  }

  @Post('signout')
  @ApiCookieAuth()
  @ApiOperation({ description: 'Sign Out Current User' })
  @ApiOkResponse({ description: 'User signed out' })
  @HttpCode(HttpStatus.OK)
  signOut(@Req() req) {
    return this.authService.signOut(req);
  }

  @Public()
  @Post('turnOnTwoFactorAuth')
  async turnOn(@Req() req) {
    const user = this.authService
      .getUserLoggedInTable()
      .get(req.cookies.trans42_access);
    return await this.authService.turnOnTwoFactorAuth(user.user_id);
  }

  @Public()
  @Post('turnOffTwoFactorAuth')
  async turnOff(@Req() req) {
    const user = this.authService
      .getUserLoggedInTable()
      .get(req.cookies.trans42_access);
    return await this.authService.turnOffTwoFactorAuth(user.user_id);
  }

  @Public()
  @Get('get2faStatus')
  async get2faStatus(@Req() req) {
    const user = this.authService
      .getUserLoggedInTable()
      .get(req.cookies.trans42_access);
    return await this.authService.get2faStatus(user.user_id);
  }

  @Public()
  @Post('generate')
  @UseGuards(AuthGuard)
  async register(@Res() response: Response, @Req() req) {
    try {
      if (!req.cookies.trans42_access) {
        throw new Error('tokens missing');
      }
      const user = this.authService
        .getUserLoggedInTable()
        .get(req.cookies.trans42_access);
      const { otpauthUrl } =
        await this.authService.generateTwoFactorAuthenticationSecret(user);
      this.authService
        .pipeQrCodeStream(response, otpauthUrl)
        .then((url) => {
          response.status(200).send(url);
        })
        .catch((err) => {
          response.status(500).send('Failed to generate QR code');
        });
      return this.authService.pipeQrCodeStream(response, otpauthUrl);
    } catch (err) {}
  }

  @Public()
  @Post('verify2fa')
  @UseGuards(AuthGuard)
  async verify2fa(@Res() response: Response, @Body('token') token: string) {
    try {
      const user = this.authService
        .getUserLoggedInTable()
        .get(response.req.cookies.trans42_access);
      const yes = await this.authService.verifyTwoFactorAuthenticationCode(
        user.user_id,
        token,
      );
      if (!yes) {
        response.status(401).send('2FA verification failed');
        return;
      }
      response.status(200).send('2FA verified');
    } catch (err) {
      response.status(500).send('Failed to verify 2FA');
    }
  }
}
