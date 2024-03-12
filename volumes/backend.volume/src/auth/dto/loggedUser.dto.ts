export class LoggedUserDto {
  user_id: number;
  login: string;
  expire_at: number;
  email: string;
  secretToken: string;
}
