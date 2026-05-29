type Any = unknown;

declare interface VpnKey {
  key: string;
  order_id?: string;
  id?: string | number;
  config_url: string;
  traffic_limit: number;
  traffic_limit_gb: number;
  finish_at: string;
  activated_at: string;
  status: number;
  status_text: string;
  payment_status?: string;
  is_free: boolean;
}
