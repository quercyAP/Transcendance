import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { LoggedUserDto } from './dto/loggedUser.dto';
import { authenticator } from 'otplib';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  private userLoggedInTable = new Map<string, LoggedUserDto>();
  private readonly logger = new Logger(AuthService.name);

  async signIn(code: string, url: string): Promise<any> {
    const form = new FormData();
    form.append('grant_type', 'authorization_code');
    form.append('client_id', this.configService.get<string>('API42_CLIENT_ID'));
    form.append(
      'client_secret',
      this.configService.get<string>('API42_CLIENT_SECRET'),
    );
    form.append('code', code);
    form.append('redirect_uri', url);

    return await this.httpService.axiosRef
      .postForm('https://api.intra.42.fr/oauth/token', form)
      .then(async (res) => {
        const ret = await this.httpService.axiosRef.get(
          'https://api.intra.42.fr/v2/me',
          {
            headers: {
              Authorization: `Bearer ${res.data.access_token}`,
            },
          },
        );
        const userToFind = await this.prisma.user.findUnique({
          where: { id: ret.data.id },
        });
        const isNewUser: boolean = userToFind ? false : true;

        const user = await this.usersService.createUserIfNotExist({
          id: ret.data.id,
          name42: ret.data.login,
          avatar42Url: ret.data.image.versions.medium,
        });
        this.userLoggedInTable.set(res.data.access_token, {
          user_id: ret.data.id,
          login: ret.data.login,
          expire_at:
            Math.round(Date.now() / 1000) + Number(res.data.expires_in),
          email: ret.data.email,
          secretToken: '',
        });
        if (user) this.logger.log('-> ' + user.name + ' signed-in.');
        return { access_token: res.data.access_token, isNewUser };
      });
  }

  async signInWithGithub(code: string): Promise<any> {
    return await this.httpService.axiosRef
      .post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.configService.get<string>('API_GITHUB_CLIENT_ID'),
          client_secret: this.configService.get<string>(
            'API_GITHUB_CLIENT_SECRET',
          ),
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      )
      .then(async (res) => {
        const ret = await this.httpService.axiosRef.get(
          'https://api.github.com/user',
          {
            headers: {
              Authorization: `token ${res.data.access_token}`,
            },
          },
        );
        const userToFind = await this.prisma.user.findUnique({
          where: { id: ret.data.id },
        });
        const isNewUser: boolean = userToFind ? false : true;
        const user = await this.usersService.createUserIfNotExist({
          id: ret.data.id,
          name42: ret.data.login,
          avatar42Url: ret.data.avatar_url,
        });

        this.userLoggedInTable.set(res.data.access_token, {
          user_id: ret.data.id,
          login: ret.data.login,
          expire_at:
            Math.round(Date.now() / 1000) + Number(res.data.expires_in),
          email: ret.data.email,
          secretToken: '',
        });
        if (user) this.logger.log('-> ' + user.name + ' signed-in.');
        return { access_token: res.data.access_token, isNewUser };
      });
  }

  async asyncVerifyToken(access_token: string): Promise<User | undefined> {
    const userLoggedIn = this.userLoggedInTable.get(access_token);
    if (!userLoggedIn) {
      throw new Error('User not logged-in');
    }
    if (userLoggedIn.expire_at < Date.now() / 1000) {
      this.userLoggedInTable.delete(access_token);
      throw new Error('User token expired');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userLoggedIn.user_id },
    });
    return user;
  }

  async signOut(req: any) {
    if (!req.cookies.trans42_access) {
      throw new Error('tokens missing');
    }
    const user = this.userLoggedInTable.get(req.cookies.trans42_access);
    if (!user) {
      throw new Error('User not logged-in');
    }
    this.userLoggedInTable.delete(req.cookies.trans42_access);
    this.logger.log('<- ' + req.user.name + ' signout...');
    return 'User signed out';
  }

  getIdForTokken(access_token: string) {
    if (!access_token) return undefined;

    const user = this.userLoggedInTable.get(access_token);
    if (!user) {
      return undefined;
    }
    return user.user_id;
  }

  async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { secretToken: secret },
    });
  }

  public async generateTwoFactorAuthenticationSecret(user: LoggedUserDto) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME'),
      secret,
    );

    await this.setTwoFactorAuthenticationSecret(secret, user.user_id);
    return {
      secret,
      otpauthUrl,
    };
  }

  public async pipeQrCodeStream(stream: any, otpauthUrl: string) {
    return new Promise<string>((resolve, reject) => {
      const QRCode = require('qrcode');
      QRCode.toString(otpauthUrl, { type: 'utf-8', scale: 4 }, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(otpauthUrl);
        }
      });
    });
  }

  public getUserLoggedInTable() {
    return this.userLoggedInTable;
  }

  public async turnOnTwoFactorAuth(currentUserId: number): Promise<any> {
    try {
      await this.prisma.user.update({
        where: { id: currentUserId },
        data: {
          is2FAEnabled: true,
        },
      });
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }

  public async turnOffTwoFactorAuth(currentUserId: number): Promise<any> {
    try {
      await this.prisma.user.update({
        where: { id: currentUserId },
        data: {
          is2FAEnabled: false,
        },
      });
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }

  public async verifyTwoFactorAuthenticationCode(
    currentUserId: number,
    twoFactorAuthCode: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    return authenticator.verify({
      token: twoFactorAuthCode,
      secret: user.secretToken,
    });
  }

  public async get2faStatus(currentUserId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    return user.is2FAEnabled;
  }
}
