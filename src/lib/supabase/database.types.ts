export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          login_id: string;
          nickname: string;
          avatar_color: "violet" | "lightBlue" | "green" | "amber" | "slate";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          login_id: string;
          nickname: string;
          avatar_color?: "violet" | "lightBlue" | "green" | "amber" | "slate";
          created_at?: string;
        };
        Update: {
          email?: string;
          login_id?: string;
          nickname?: string;
          avatar_color?: "violet" | "lightBlue" | "green" | "amber" | "slate";
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          weekly_goal_type: "days" | "pages";
          weekly_goal_value: number;
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          weekly_goal_type: "days" | "pages";
          weekly_goal_value: number;
          invite_code: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          weekly_goal_type?: "days" | "pages";
          weekly_goal_value?: number;
          invite_code?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "member";
        };
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          author: string;
          total_pages: number;
          status: "reading" | "finished";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          author: string;
          total_pages: number;
          status?: "reading" | "finished";
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          author?: string;
          total_pages?: number;
          status?: "reading" | "finished";
        };
        Relationships: [];
      };
      reading_logs: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          book_id: string | null;
          date: string;
          day_of_week: number;
          did_read: boolean;
          pages_read: number;
          memo: string | null;
          reading_time: number | null;
          start_page: number | null;
          end_page: number | null;
          mood_tag: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          book_id?: string | null;
          date: string;
          day_of_week: number;
          did_read: boolean;
          pages_read?: number;
          memo?: string | null;
          reading_time?: number | null;
          start_page?: number | null;
          end_page?: number | null;
          mood_tag?: string | null;
          created_at?: string;
        };
        Update: {
          book_id?: string | null;
          did_read?: boolean;
          pages_read?: number;
          memo?: string | null;
          reading_time?: number | null;
          start_page?: number | null;
          end_page?: number | null;
          mood_tag?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
