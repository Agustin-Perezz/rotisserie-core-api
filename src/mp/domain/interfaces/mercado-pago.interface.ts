export interface MercadoPagoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
  user_id: number;
  public_key: string;
}

export interface WebhookNotificationBody {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface WebhookQueryParams {
  'data.id'?: string;
  type?: string;
  topic?: string;
  id?: string;
}
