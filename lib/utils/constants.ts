// Elo defaults
export const ELO_INITIAL_RATING = 1200;
export const ELO_K_PROVISIONAL = 32;
export const ELO_K_ESTABLISHED = 16;
export const ELO_PROVISIONAL_THRESHOLD = 20;
export const ELO_RATING_FLOOR = 100;

// Matchmaking
export const MATCHMAKING_INITIAL_RANGE = 200;
export const MATCHMAKING_EXPANDED_RANGE = 400;
export const MATCHMAKING_EXPAND_AFTER_SECONDS = 60;
export const MATCHMAKING_ANY_AFTER_SECONDS = 120;

// Sprint
export const SPRINT_INTERACTIONS_COUNT = 8;
export const SPRINT_GENERATION_RATE_LIMIT = 5; // per user per hour
export const EVALUATION_RATE_LIMIT = 30; // per user per hour

// Duel timeouts
export const DUEL_WAITING_TIMEOUT_MINUTES = 15;
export const DUEL_PROGRESS_TIMEOUT_MINUTES = 30;

// AI Models
export const AI_MODEL_GENERATION = "claude-opus-4-6";
export const AI_MODEL_EVALUATION = "claude-sonnet-4-5-20250929";

// Animation
export const CARD_SPRING = { stiffness: 300, damping: 25 };
export const SCORE_COUNT_DURATION = 1.5; // seconds
