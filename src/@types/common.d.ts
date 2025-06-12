type Any = any;

declare interface VpnResponseInstance<T> {
  data: T;
  success: boolean;
}

declare interface VpnKey {
  key: string;
  config_url: string;
  traffic_limit: number;
  traffic_limit_gb: number;
  finish_at: string;
  activated_at: string;
  status: string;
  status_text: string;
  is_free: boolean;
}

declare interface VpnInstruction {
  title: string;
  steps?: Array<string>;
  links?: Array<{ title: string; url: string }>;
}
