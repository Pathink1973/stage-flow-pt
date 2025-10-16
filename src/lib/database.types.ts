export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          is_pro: boolean
          project_id: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          is_pro?: boolean
          project_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          is_pro?: boolean
          project_id?: string
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          pin: string | null
          theme: Json
          qa_public: boolean
          stage_theme_mode: 'light' | 'dark'
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          pin?: string | null
          theme?: Json
          qa_public?: boolean
          stage_theme_mode?: 'light' | 'dark'
          project_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          pin?: string | null
          theme?: Json
          qa_public?: boolean
          stage_theme_mode?: 'light' | 'dark'
          project_id?: string
          created_at?: string
        }
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          role: 'owner' | 'controller' | 'assistant' | 'viewer'
          project_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          role: 'owner' | 'controller' | 'assistant' | 'viewer'
          project_id?: string
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          role?: 'owner' | 'controller' | 'assistant' | 'viewer'
          project_id?: string
          joined_at?: string
        }
      }
      cues: {
        Row: {
          id: string
          room_id: string
          idx: number
          title: string
          speaker: string | null
          duration_sec: number
          notes: string | null
          auto_advance: boolean
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          idx: number
          title: string
          speaker?: string | null
          duration_sec?: number
          notes?: string | null
          auto_advance?: boolean
          project_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          idx?: number
          title?: string
          speaker?: string | null
          duration_sec?: number
          notes?: string | null
          auto_advance?: boolean
          project_id?: string
          created_at?: string
        }
      }
      timers: {
        Row: {
          id: string
          room_id: string
          cue_id: string | null
          type: 'countdown' | 'stopwatch' | 'clock'
          target_ts: string | null
          base_sec: number
          state: 'idle' | 'running' | 'paused' | 'finished'
          started_at: string | null
          elapsed_sec: number
          overrun_sec: number
          project_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          cue_id?: string | null
          type?: 'countdown' | 'stopwatch' | 'clock'
          target_ts?: string | null
          base_sec?: number
          state?: 'idle' | 'running' | 'paused' | 'finished'
          started_at?: string | null
          elapsed_sec?: number
          overrun_sec?: number
          project_id?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          cue_id?: string | null
          type?: 'countdown' | 'stopwatch' | 'clock'
          target_ts?: string | null
          base_sec?: number
          state?: 'idle' | 'running' | 'paused' | 'finished'
          started_at?: string | null
          elapsed_sec?: number
          overrun_sec?: number
          project_id?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          kind: 'ticker' | 'overlay'
          level: 'info' | 'warn' | 'alert'
          body: string
          is_active: boolean
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          kind?: 'ticker' | 'overlay'
          level?: 'info' | 'warn' | 'alert'
          body: string
          is_active?: boolean
          project_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          kind?: 'ticker' | 'overlay'
          level?: 'info' | 'warn' | 'alert'
          body?: string
          is_active?: boolean
          project_id?: string
          created_at?: string
        }
      }
      qa_submissions: {
        Row: {
          id: string
          room_id: string
          author: string | null
          body: string
          status: 'pending' | 'approved' | 'rejected' | 'answered'
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          author?: string | null
          body: string
          status?: 'pending' | 'approved' | 'rejected' | 'answered'
          project_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          author?: string | null
          body?: string
          status?: 'pending' | 'approved' | 'rejected' | 'answered'
          project_id?: string
          created_at?: string
        }
      }
      device_sessions: {
        Row: {
          id: string
          room_id: string
          role: string
          device_info: Json | null
          project_id: string
          last_seen: string
        }
        Insert: {
          id?: string
          room_id: string
          role: string
          device_info?: Json | null
          project_id?: string
          last_seen?: string
        }
        Update: {
          id?: string
          room_id?: string
          role?: string
          device_info?: Json | null
          project_id?: string
          last_seen?: string
        }
      }
      timer_color_settings: {
        Row: {
          id: string
          room_id: string
          warning_threshold_sec: number
          critical_threshold_sec: number
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          warning_threshold_sec?: number
          critical_threshold_sec?: number
          project_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          warning_threshold_sec?: number
          critical_threshold_sec?: number
          project_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
