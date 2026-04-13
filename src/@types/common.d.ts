type Any = unknown;

declare interface VpnResponseInstance<T> {
  data: T;
  success: boolean;
}

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

declare interface VpnInstruction {
  title: string;
  steps?: Array<string>;
  links?: Array<{ title: string; url: string }>;
}
