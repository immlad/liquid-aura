export type Server = {
  id: string;
  name: string;
  icon_emoji: string | null;
  owner_id: string;
  join_code: string;
  created_at: string;
};

export type Channel = {
  id: string;
  server_id: string;
  name: string;
  type: "text" | "voice";
  position: number;
  created_at: string;
};

export type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};
