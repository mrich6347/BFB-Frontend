
export interface CreateBudgetRequest {
    name: string
    currency: string
    currency_placement: CurrencyPlacement
    number_format: NumberFormat
    date_format: DateFormat
}

export interface BudgetResponse {
    id: string
    name: string
    currency: string
    currency_placement: CurrencyPlacement
    date_format: DateFormat
    number_format: NumberFormat
    updated_at: Date
}


export enum CurrencyPlacement {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER'
}

export enum DateFormat {
    ISO = 'ISO',           // 2025/12/30
    HYPHEN = 'HYPHEN',     // 2025-12-30
    EUROPEAN = 'EUROPEAN', // 30-12-2025
    UK_SLASH = 'UK_SLASH', // 30/12/2025
    PERIOD = 'PERIOD',     // 30.12.2025
    US_SLASH = 'US_SLASH', // 12/30/2025
    DOT_NOTATION = 'DOT_NOTATION' // 2025.12.30
}

export enum NumberFormat {
    DOT_COMMA = 'DOT_COMMA',           // 123,456.78
    COMMA_COMMA = 'COMMA_COMMA',       // 123.456,78
    DOT_COMMA_THREE = 'DOT_COMMA_THREE', // 123,456.789
    SPACE_DOT = 'SPACE_DOT',           // 123 456.78
    APOSTROPHE_DOT = 'APOSTROPHE_DOT', // 123'456.78
    DOT_NO_DECIMAL = 'DOT_NO_DECIMAL', // 123.456
    COMMA_NO_DECIMAL = 'COMMA_NO_DECIMAL', // 123,456
    SPACE_HYPHEN = 'SPACE_HYPHEN',     // 123 456-78
    SPACE_COMMA = 'SPACE_COMMA',       // 123 456,78
    COMMA_SLASH = 'COMMA_SLASH',       // 123,456/78
    SPACE_NO_DECIMAL = 'SPACE_NO_DECIMAL', // 123 456
    COMMA_DOT_LEADING = 'COMMA_DOT_LEADING' // 1,23,456.78
}