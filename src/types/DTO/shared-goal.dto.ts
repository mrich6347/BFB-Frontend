export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}



export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED'
}



export interface CreateSharedGoalDto {
  name: string;
  description?: string;
  target_amount: number;
  target_date?: string;
}

export interface UpdateSharedGoalDto {
  name?: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  status?: GoalStatus;
}

export interface GoalParticipantResponse {
  id: string;
  goal_id: string;
  user_profile_id: string;
  monthly_contribution?: number;
  category_id?: string;
  budget_id: string;
  joined_at: Date;
  user_profile: {
    username: string;
    display_name: string;
  };
  category?: {
    id: string;
    name: string;
    available_balance?: number;
  };
  current_contribution?: number;
  contribution_percentage?: number;
}

export interface SharedGoalResponse {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  target_date?: Date;
  created_by: string;
  budget_id?: string;
  status: GoalStatus;
  created_at: Date;
  updated_at: Date;
  creator_profile?: {
    username: string;
    display_name: string;
  };
  participants?: GoalParticipantResponse[];
  current_amount?: number;
  progress_percentage?: number;
}

export interface CreateInvitationDto {
  invitee_username: string;
}

export interface InvitationResponse {
  id: string;
  goal_id: string;
  inviter_id: string;
  invitee_username: string;
  invitee_id?: string;
  status: InvitationStatus;
  expires_at: Date;
  created_at: Date;
  goal: {
    id: string;
    name: string;
    target_amount: number;
  };
  inviter_profile: {
    username: string;
    display_name: string;
  };
}

export interface UpdateParticipantDto {
  monthly_contribution?: number;
  category_id?: string;
}



export interface ParticipantWithProgressResponse extends GoalParticipantResponse {
  current_contribution: number;
  contribution_percentage: number;
}

export interface GoalProgressResponse {
  goal: SharedGoalResponse;
  current_amount: number;
  progress_percentage: number;
  projected_completion_date?: Date;
  participants_with_progress: ParticipantWithProgressResponse[];
}
