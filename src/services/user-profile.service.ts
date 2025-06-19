import type {
  CreateUserProfileDto,
  UpdateUserProfileDto,
  UserProfileResponse,
  PublicUserProfileResponse
} from "../types/DTO/user-profile.dto"
import api from "./common/api"

export class UserProfileService {
  static async create(createUserProfileDto: CreateUserProfileDto): Promise<UserProfileResponse> {
    const response = await api.post('/user-profiles', createUserProfileDto)
    return response.data
  }

  static async getCurrentUserProfile(): Promise<UserProfileResponse | null> {
    const response = await api.get('/user-profiles/me')
    return response.data
  }

  static async updateCurrentUserProfile(updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfileResponse> {
    const response = await api.put('/user-profiles/me', updateUserProfileDto)
    return response.data
  }

  static async searchUsers(username: string): Promise<PublicUserProfileResponse[]> {
    if (!username || username.trim().length === 0) {
      return []
    }

    const response = await api.get('/user-profiles/search', {
      params: { username: username.trim() }
    })
    return response.data
  }

  // Removed findByUsername - username availability is now checked during create/update
}
