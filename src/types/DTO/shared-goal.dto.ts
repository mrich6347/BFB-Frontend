export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export enum ParticipantStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED'
}

export enum ActivityType {
  CONTRIBUTION_UPDATED = 'CONTRIBUTION_UPDATED',
  CATEGORY_CHANGED = 'CATEGORY_CHANGED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT'
}

export interface CreateSharedGoalDto {
  name: string;
  description?: string;
  target_amount: number;
  target_date?: string;
  is_private?: boolean;
}

export interface UpdateSharedGoalDto {
  name?: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  is_private?: boolean;
  status?: GoalStatus;
}

export interface GoalParticipantResponse {
  id: string;
  goal_id: string;
  user_profile_id: string;
  monthly_contribution?: number;
  category_id?: string;
  budget_id: string;
  status: ParticipantStatus;
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
  is_private: boolean;
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

export interface GoalActivityResponse {
  id: string;
  goal_id: string;
  user_profile_id: string;
  activity_type: ActivityType;
  amount_change?: number;
  description: string;
  created_at: Date;
  user_profile: {
    username: string;
    display_name: string;
  };
}
