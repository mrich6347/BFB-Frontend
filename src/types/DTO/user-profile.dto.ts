export interface CreateUserProfileDto {
  username: string;
  display_name: string;
}

export interface UpdateUserProfileDto {
  username?: string;
  display_name?: string;
}

export interface SearchUserProfileDto {
  username: string;
}

export interface UserProfileResponse {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUserProfileResponse {
  username: string;
  display_name: string;
}
