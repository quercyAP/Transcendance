import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateCurrentUserDto } from './dto/update-currentUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AvatarUploadedResponseDto, FileUploadDto } from './dto/fileUpload.dto';
import { Express } from 'express';

@ApiTags('users')
@ApiCookieAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //////////////////////////////////////////////////////////////
  @Get('everyone_else')
  @ApiOperation({ description: 'Get all public users' })
  getEveryoneElse(@Req() req) {
    return this.usersService.getEveryoneElse(req.user.id);
  }
  ////////////////////////////////////////////////////////////////
  @Get('/name/:id')
  @ApiOperation({ description: 'Get user by id' })
  getUserById(@Param('id') id: number) {
    return this.usersService.getUserById(+id);
  }

  //////////////////////////////////////////////////////////////
  @Get('me')
  @ApiOperation({ description: 'Get my user' })
  getMe(@Req() req) {
    return this.usersService.getMe(req.user.id);
  }
  //////////////////////////////////////////////////////////////
  @Get('me/friends')
  @ApiOperation({ description: 'Get my friends' })
  getMyFriends(@Req() req) {
    return this.usersService.getMyFriends(req.user.id);
  }
  //////////////////////////////////////////////////////////////
  @Get('me/blocked_user')
  @ApiOperation({ description: 'Get my blocked user' })
  getMyBlockedUsers(@Req() req) {
    return this.usersService.getMyBlockedUsers(req.user.id);
  }
  //////////////////////////////////////////////////////////////
  @Get('me/friend_invitations_sent')
  @ApiOperation({ description: 'Get my friend invitations sent' })
  getMyInvitationsSent(@Req() req) {
    return this.usersService.getMyInvitationsSent(req.user.id);
  }
  //////////////////////////////////////////////////////////////
  @Get('me/friend_invitations_received')
  @ApiOperation({ description: 'Get my friend invitations received' })
  getMyInvitationsReceived(@Req() req) {
    return this.usersService.getMyInvitationsReceived(req.user.id);
  }
  //////////////////////////////////////////////////////////////
  @Get('games/:id')
  @ApiOperation({ description: 'Get games by id' })
  getMyGames(@Param('id') id: number){
    return this.usersService.getMyGames(+id);
  }
  //////////////////////////////////////////////////////////////
  @Get('is_on_game/:id')
  @ApiOperation({ description: 'Get games by id' })
  getOnGame(@Param('id') id: number){
    return this.usersService.getOnGame(+id);
  }
  ///////////////////////////////////////////////////////////////
  @Patch('is_on_game/:id')
  @ApiOperation({ description: 'Set is_on_game' })
  setIsOnGame(@Param('id') id: number, @Body() body) {
    return this.usersService.setIsOnGame(+id, body.is_on_game);
  }
  //////////////////////////////////////////////////////////////
  @Patch('me')
  @ApiOperation({ description: 'Update my user' })
  updateMe(@Req() req, @Body() updateUserDto: UpdateCurrentUserDto) {
    return this.usersService.setMe(req.user.id, updateUserDto);
  }
  //////////////////////////////////////////////////////////////
  @Post('me/set_my_avatar')
  @ApiOperation({
    description:
      'Upload avatar to current user. Max file size 1MB. Only images allowed',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'My avatar',
    type: FileUploadDto,
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: AvatarUploadedResponseDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async setMyAvatar(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const filename = await this.usersService.setMyAvatar(req.user.id, file);
    return {
      status: 'ok',
      message: 'The record has been successfully created.',
      data: { fileName: filename },
    };
  }
  //////////////////////////////////////////////////////////////
  @Patch('me/blockuser/:id')
  @ApiOperation({
    description:
      "Block the user. You'll no longer receive message from this user",
  })
  blockUser(@Req() req, @Param('id') id: string) {
    return this.usersService.blockUser(req.user.id, +id);
  }
  //////////////////////////////////////////////////////////////
  @Patch('me/unblockuser/:id')
  @ApiOperation({
    description: "Unblock the user. You'll see messages from this user ",
  })
  unblockUser(@Req() req, @Param('id') id: string) {
    return this.usersService.unBlockUser(req.user.id, +id);
  }
  //////////////////////////////////////////////////////////////
  @Patch('me/invite_friend/:id')
  @ApiOperation({ description: 'Send friend invitation to the user' })
  inviteFriend(@Req() req, @Param('id') id: string) {
    return this.usersService.inviteFriend(req.user.id, +id);
  }
  //////////////////////////////////////////////////////////////
  @Patch('me/reject_invitation_friend/:id')
  @ApiOperation({ description: 'Reject the invitation from the user' })
  rejectInvitationFriend(@Req() req, @Param('id') id: string) {
    return this.usersService.rejectInvitationFriend(req.user.id, +id);
  }
  //////////////////////////////////////////////////////////////
  @Patch('me/accept_friend/:id')
  @ApiOperation({ description: 'Accept friend invitation from the user' })
  acceptFriend(@Req() req, @Param('id') id: string) {
    return this.usersService.acceptFriend(req.user.id, +id);
  }
  //////////////////////////////////////////////////////////////
  @Patch('me/unfriend/:id')
  @ApiOperation({ description: 'UnFriend the user' })
  unFriend(@Req() req, @Param('id') id: string) {
    return this.usersService.unFriend(req.user.id, +id);
  }
  //////////////////////////////////////////////////////////////
}
