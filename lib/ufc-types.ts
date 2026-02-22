// Shared types for UFC Notify (ESPN API + DB)

export type FightStatus = "not_started" | "in_progress" | "complete";

export interface UFCEvent {
  id: string;
  espn_event_id: string;
  name: string;
  event_date: string;
  venue?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UFCFight {
  id: string;
  event_id: string;
  espn_competition_id: string;
  fighter1_name: string;
  fighter2_name: string;
  weight_class?: string;
  order_index: number;
  status: FightStatus;
  winner_athlete_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UFCEventWithFights extends UFCEvent {
  fights: UFCFight[];
}

// ESPN API response types (partial)
export interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
  day?: { date: string };
}

export interface ESPNEvent {
  id: string;
  name: string;
  date: string;
  competitions?: ESPNCompetition[];
  venue?: { fullName?: string };
}

export interface ESPNCompetition {
  id: string;
  date?: string;
  startDate?: string;
  type?: { abbreviation?: string };
  competitors: ESPNCompetitor[];
  status: {
    type?: {
      state?: string;
      completed?: boolean;
      name?: string;
    };
  };
}

export interface ESPNCompetitor {
  id: string;
  order?: number | string;
  winner?: boolean;
  athlete?: { fullName?: string; displayName?: string };
}
