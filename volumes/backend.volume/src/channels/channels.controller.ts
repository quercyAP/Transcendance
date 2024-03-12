import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import {
  BanUserDto,
  InviteUserToPrivateDto,
  KickUserDto,
  MuteUserDto,
  SetAdminDto,
  UpdateChannelTypeDto,
} from './dto/update-channel.dto';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('channels')
@ApiCookieAuth()
@Controller('api/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}
  /////////////////////////////////////////////////////////////////////////////////
  @Post()
  @ApiOperation({
    description:
      'Create new channel with current user as owner. The name of the channel (must be unique)',
  })
  @ApiResponse({
    status: 409,
    description: 'Channel name already exists',
  })
  async create(@Req() req, @Body() createChannelDto: CreateChannelDto) {
    return await this.channelsService.create(req.user.id, createChannelDto);
  }

  /////////////////////////////////////////////////////////////////////////////////
  @Get('me')
  @ApiOperation({
    description: 'Get all channels of current user',
  })
  async findAllCurrentUser(@Req() req) {
    return await this.channelsService.findAllCurrentUser(req.user.id);
  }

  /////////////////////////////////////////////////////////////////////////////////
  @Get('public')
  @ApiOperation({
    description: 'Get all public/protected channels',
  })
  async findAllPublic() {
    return await this.channelsService.findAllPublic();
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Post('public/join/:id')
  @ApiOperation({
    description: 'Join public/protected channel',
  })
  async joinPublic(
    @Req() req,
    @Param('id') id: string,
    @Query('password') password?: string,
  ) {
    return await this.channelsService.joinPublic(req.user.id, +id, password);
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Post('me/leave/:id')
  @ApiOperation({
    description: 'Leave channel',
  })
  async leave(@Req() req, @Param('id') id: string) {
    return await this.channelsService.leave(req.user.id, +id);
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Get('me/:id')
  @ApiOperation({ description: 'Get one channel of current user' })
  async findOneCurrentUser(@Req() req, @Param('id') id: string) {
    return await this.channelsService.findOneCurrentUser(req.user.id, +id);
  }

  /////////////////////////////////////////////////////////////////////////////////
  @Patch('owner/change_name/:id')
  @ApiOperation({
    description: 'Update the name of one owned channel of current user',
  })
  @ApiResponse({
    status: 409,
    description: 'Channel name already exists',
  })
  async updateNameByOwner(
    @Req() req,
    @Param('id') id: string,
    @Body() name: string,
  ) {
    return await this.channelsService.updateNameByOwner(req.user.id, +id, name);
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Patch('owner/set_admin')
  @ApiOperation({
    description: 'Set admin of one owned channel of current user',
  })
  async setAdminByOwner(@Req() req, @Body() setAdminDto: SetAdminDto) {
    return await this.channelsService.setAdminByOwner(req.user.id, setAdminDto);
  }

  /////////////////////////////////////////////////////////////////////////////////
  @Patch('owner/change_type_password/:id')
  @ApiOperation({
    description:
      'Update the type/password of one owned channel of current user',
  })
  async updateTypePswdByOwner(
    @Req() req,
    @Param('id') id: string,
    @Body() updateChannelTypeDto: UpdateChannelTypeDto,
  ) {
    return await this.channelsService.updateTypePswdByOwner(
      req.user.id,
      +id,
      updateChannelTypeDto,
    );
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Patch('admin/kick_user/')
  @ApiOperation({ description: 'Kick user of the channel' })
  async kickUser(@Req() req, @Body() kickUserDto: KickUserDto) {
    return await this.channelsService.kickUser(req.user.id, kickUserDto);
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Patch('admin/mute_user/')
  @ApiOperation({ description: 'Mute user of the channel' })
  async muteUser(@Req() req, @Body() muteUserDto: MuteUserDto) {
    return await this.channelsService.muteUser(req.user.id, muteUserDto);
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Patch('admin/invite_user/')
  @ApiOperation({ description: 'Invite user to private channel' })
  @ApiResponse({
    status: 409,
    description: 'User already in channel',
  })
  async inviteUserToPrivate(
    @Req() req,
    @Body() inviteUserToPrivateDto: InviteUserToPrivateDto,
  ) {
    return await this.channelsService.inviteUserToPrivate(
      req.user.id,
      inviteUserToPrivateDto,
    );
  }
  /////////////////////////////////////////////////////////////////////////////////
  @Patch('admin/ban_user/')
  @ApiOperation({ description: 'Ban user of the channel' })
  @ApiResponse({
    status: 409,
    description: 'User already banned',
  })
  async banUser(@Req() req, @Body() banUserDto: BanUserDto) {
    return await this.channelsService.banUser(req.user.id, banUserDto);
  }

  /////////////////////////////////////////////////////////////////////////////////
  @Patch('admin/unban_user/')
  @ApiOperation({ description: 'Unban user of the channel' })
  async unBanUser(
    @Req() req,
    @Body() inviteUserToPrivateDto: InviteUserToPrivateDto,
  ) {
    return await this.channelsService.unBanUser(
      req.user.id,
      inviteUserToPrivateDto,
    );
  }

  /////////////////////////////////////////////////////////////////////////////////
  @Delete('owner/:id')
  @ApiOperation({ description: 'Delete one owned channel of current user' })
  async removeByOwner(@Req() req, @Param('id') id: string) {
    return await this.channelsService.removeByOwner(req.user.id, +id);
  }
}
