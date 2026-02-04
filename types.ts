
export enum TeamSide {
  CT = 'CT',
  T = 'T'
}

export enum RoundEndReason {
  TargetBombed = 'Bomba Detonada',
  BombDefused = 'Bomba Desarmada',
  TerroristsEliminated = 'Terroristas Eliminados',
  CTsEliminated = 'CTs Eliminados',
  TargetSaved = 'Tempo Esgotado', // Target Saved geralmente significa tempo acabou para os TRs
}

export interface Team {
  id: string;
  name: string;
  side: TeamSide;
  score: number;
  logo?: string;
}

export interface Round {
  number: number;
  winnerSide: TeamSide;
  endReason: RoundEndReason;
  duration: string; // e.g., "1:45"
  bombPlanted: boolean;
  totalKills: number;
  firstKillSide: TeamSide;
  ctMoney: number;
  tMoney: number;
}

export interface Match {
  id: string;
  mapName: string;
  mapImage: string;
  date: string;
  tournamentName?: string; // Nome do campeonato
  teamA: Team;
  teamB: Team;
  rounds: Round[];
  duration: string; // Match duration e.g., "45m"
  uploadedAt: string;
}

// --- SUPABASE TYPES ---

export interface DBTeam {
  id: string;
  match_id: string;
  name: string;
  side: TeamSide;
  score: number;
  logo?: string;
  created_at: string;
}

export interface DBRound {
  id: string;
  match_id: string;
  number: number;
  winner_side: TeamSide;
  end_reason: RoundEndReason;
  duration: string;
  bomb_planted: boolean;
  total_kills: number;
  first_kill_side: TeamSide;
  ct_money: number;
  t_money: number;
  created_at: string;
}

export interface DBMatch {
  id: string;
  map_name: string;
  map_image: string;
  date: string;
  team_a_id: string;
  team_b_id: string;
  duration: string;
  file_name: string;
  uploaded_at: string;
  created_at: string;
}

export interface ProcessingStatus {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export type StatMetric = {
  label: string;
  value: string | number;
  trend?: number; // positive is up, negative is down
  color?: string;
}

// --- AUTH TYPES ---

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  password?: string; // Optional because we might not return it in listings
  role: UserRole;
  isVip: boolean; // VIP users have access to Comparison and Bets
  createdAt: string;
}

// --- BETS TYPES ---

export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED'
}

export interface Bet {
  id: string;
  userId: string;
  matchId?: string;
  bettingHouse: string;
  betAmount: number;
  odd: number;
  potentialReturn: number;
  betStatus: BetStatus;
  betDate: string;
  resultDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBBet {
  id: string;
  user_id: string;
  match_id?: string;
  betting_house: string;
  bet_amount: number;
  odd: number;
  potential_return: number;
  bet_status: BetStatus;
  bet_date: string;
  result_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashAccount {
  id: string;
  userId: string;
  bettingHouse: string;
  initialBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBCashAccount {
  id: string;
  user_id: string;
  betting_house: string;
  initial_balance: number;
  created_at: string;
  updated_at: string;
}
