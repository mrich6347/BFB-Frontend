export interface NetWorthHistoryResponse {
    id: string;
    user_id: string;
    budget_id: string;
    month_date: string;
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    note?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateNetWorthSnapshotDto {
    budget_id: string;
    month_date?: string; // Optional, defaults to current month
}

export interface UploadYNABNetWorthDto {
    budget_id: string;
    csv_data: string;
}

export interface NetWorthChartDataPoint {
    month_date: string;
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    note?: string;
}

export interface NetWorthChartResponse {
    has_data: boolean;
    data_points: NetWorthChartDataPoint[];
}

export interface UpdateNetWorthNoteDto {
    budget_id: string;
    month_date: string;
    note?: string;
}

