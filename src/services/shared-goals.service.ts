import type {
  CreateSharedGoalDto,
  UpdateSharedGoalDto,
  SharedGoalResponse,
  CreateInvitationDto,
  InvitationResponse,
  UpdateParticipantDto,
  UpdateParticipantByCreatorDto,
  GoalProgressResponse,
  GoalEventResponse
} from "../types/DTO/shared-goal.dto"
import api from "./common/api"

export class SharedGoalsService {
  // Basic CRUD operations for goals
  static async create(createSharedGoalDto: CreateSharedGoalDto): Promise<SharedGoalResponse> {
    const response = await api.post('/shared-goals', createSharedGoalDto)
    return response.data
  }

  static async findAll(budgetId: string): Promise<SharedGoalResponse[]> {
    const response = await api.get('/shared-goals', { params: { budgetId } })
    return response.data
  }

  static async findById(goalId: string): Promise<SharedGoalResponse> {
    const response = await api.get(`/shared-goals/${goalId}`)
    return response.data
  }

  static async update(goalId: string, updateSharedGoalDto: UpdateSharedGoalDto): Promise<SharedGoalResponse> {
    const response = await api.put(`/shared-goals/${goalId}`, updateSharedGoalDto)
    return response.data
  }

  static async delete(goalId: string): Promise<void> {
    await api.delete(`/shared-goals/${goalId}`)
  }

  // Invitation operations (to be implemented in Phase 4)
  static async inviteUser(goalId: string, createInvitationDto: CreateInvitationDto): Promise<InvitationResponse> {
    const response = await api.post(`/shared-goals/${goalId}/invite`, createInvitationDto)
    return response.data
  }

  static async getInvitations(): Promise<InvitationResponse[]> {
    const response = await api.get('/shared-goals/invitations')
    return response.data
  }

  static async acceptInvitation(invitationId: string): Promise<void> {
    await api.post(`/shared-goals/invitations/${invitationId}/accept`)
  }

  static async declineInvitation(invitationId: string): Promise<void> {
    await api.post(`/shared-goals/invitations/${invitationId}/decline`)
  }

  // Participant operations (to be implemented in Phase 5)
  static async updateParticipant(goalId: string, updateParticipantDto: UpdateParticipantDto): Promise<void> {
    await api.put(`/shared-goals/${goalId}/participant`, updateParticipantDto)
  }

  static async updateParticipantByCreator(goalId: string, participantId: string, updateParticipantByCreatorDto: UpdateParticipantByCreatorDto): Promise<void> {
    await api.put(`/shared-goals/${goalId}/participant/${participantId}/by-creator`, updateParticipantByCreatorDto)
  }

  static async leaveGoal(goalId: string): Promise<void> {
    await api.post(`/shared-goals/${goalId}/leave`)
  }

  static async removeParticipant(goalId: string, participantId: string): Promise<void> {
    await api.delete(`/shared-goals/${goalId}/participant/${participantId}`)
  }

  // Progress operations (Phase 5)
  static async getGoalProgress(goalId: string): Promise<GoalProgressResponse> {
    const response = await api.get(`/shared-goals/${goalId}/progress`)
    return response.data
  }

  // Events operations
  static async getGoalEvents(goalId: string, daysBack: number = 7): Promise<GoalEventResponse[]> {
    const response = await api.get(`/shared-goals/${goalId}/events`, { params: { daysBack } })
    return response.data
  }
}
