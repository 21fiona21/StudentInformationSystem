export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      course_schedule: {
        Row: {
          course_id: number | null
          id: number
          room_id: number | null
          timeslot_id: number | null
          weekday: string
        }
        Insert: {
          course_id?: number | null
          id?: number
          room_id?: number | null
          timeslot_id?: number | null
          weekday: string
        }
        Update: {
          course_id?: number | null
          id?: number
          room_id?: number | null
          timeslot_id?: number | null
          weekday?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedule_course_id_fkey1"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedule_room_id_fkey1"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedule_timeslot_id_fkey"
            columns: ["timeslot_id"]
            isOneToOne: false
            referencedRelation: "timeslots"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_name: string
          ects: number
          format: string
          id: number
          language: string
          lecturer_id: number | null
          max_participants: number | null
          status: string | null
        }
        Insert: {
          course_name: string
          ects: number
          format: string
          id?: number
          language: string
          lecturer_id?: number | null
          max_participants?: number | null
          status?: string | null
        }
        Update: {
          course_name?: string
          ects?: number
          format?: string
          id?: number
          language?: string
          lecturer_id?: number | null
          max_participants?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "lecturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_lecturer_id_fkey1"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "lecturers"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: number
          enrollment_date: string
          enrollment_id: number
          grade: number | null
          student_id: number
        }
        Insert: {
          course_id: number
          enrollment_date: string
          enrollment_id?: number
          grade?: number | null
          student_id: number
        }
        Update: {
          course_id?: number
          enrollment_date?: string
          enrollment_id?: number
          grade?: number | null
          student_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturers: {
        Row: {
          address: string
          birthday: string
          email: string
          first_name: string
          id: number
          last_name: string
          normalized_email: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          birthday: string
          email: string
          first_name: string
          id?: number
          last_name: string
          normalized_email?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          birthday?: string
          email?: string
          first_name?: string
          id?: number
          last_name?: string
          normalized_email?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number | null
          id: number
          name: string
        }
        Insert: {
          capacity?: number | null
          id?: number
          name: string
        }
        Update: {
          capacity?: number | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          birthday: string | null
          email: string | null
          enrollment_date: string | null
          first_name: string | null
          id: number
          last_name: string | null
          normalized_email: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          email?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          normalized_email?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          email?: string | null
          enrollment_date?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          normalized_email?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timeslots: {
        Row: {
          end_time: string
          id: number
          label: string | null
          start_time: string
        }
        Insert: {
          end_time: string
          id?: number
          label?: string | null
          start_time: string
        }
        Update: {
          end_time?: string
          id?: number
          label?: string | null
          start_time?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_lecturer_schedule: {
        Args: { lecturer_id_input: number }
        Returns: {
          weekday: string
          start_time: string
          end_time: string
          label: string
          course_id: number
          course_name: string
          room_name: string
          enrolled_count: number
          max_participants: number
          language: string
          ects: number
          format: string
          status: string
          enrollments: Json
        }[]
      }
      get_student_schedule: {
        Args: { student_id_input: number }
        Returns: {
          weekday: string
          start_time: string
          end_time: string
          label: string
          course_id: number
          course_name: string
          room_name: string
        }[]
      }
      get_room_a_schedule: {
        Args: Record<string, never>
        Returns: {
          label: string
          weekday: string
          course_id: number | null
        }[]
      }
      get_room_schedule: {
        Args: { room_name_input: string }
        Returns: {
            weekday: string
            label: string
            course_id: number
            course_name: string
            lecturer_name: string
            enrolled_count: number
            room_name: string
        }[]
    }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
