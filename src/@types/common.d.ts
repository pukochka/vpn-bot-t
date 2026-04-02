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
  status: number;
  status_text: string;
  is_free: boolean;
}

declare interface User {
  id: number;
  bot_id: number;
  user: {
    id: number;
    telegram_id: number;
    username: string;
    first_name: string;
    last_name: string;
    link: string;
    type: string;
  };
  ref: null;
  money: number;
  status: number;
  create_at: number;
  update_at: number;
  secret_user_key: string;
}

declare interface VpnInstruction {
  title: string;
  steps?: Array<string>;
  links?: Array<{ title: string; url: string }>;
}
