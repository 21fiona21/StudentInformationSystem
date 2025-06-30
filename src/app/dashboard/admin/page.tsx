'use client';

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SqlEditor from "@/components/SqlEditor";

export default function AdminDashboard() {
  // Create Supabase client for client-side data fetching
  const supabase = createClientComponentClient<Database>();
  
  // State to track if the current user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States to store schedules for each room
  const [roomSchedule, setRoomSchedule] = useState<any[]>([]);
  const [roomBSchedule, setRoomBSchedule] = useState<any[]>([]);
  const [roomCSchedule, setRoomCSchedule] = useState<any[]>([]);
  const [onlineSchedule, setOnlineSchedule] = useState<any[]>([]);

  // Check if the logged-in user is the admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (email === "admin@fhsg.ch") {
        setIsAdmin(true);
      }
      setIsLoading(false);
    };
    checkAdmin();
  }, []);

  // Fetch schedule for Room A
  useEffect(() => {
    const fetchSchedule = async () => {
      const { data, error } = await supabase.rpc("get_room_schedule", {
        room_name_input: "A",
      });
      if (error) {
        console.error("Error loading room schedule:", error);
      } else {
        // Transform data to consistent shape
        const transformed = data.map((entry: any) => ({
          time_label: entry.label,
          weekday: entry.weekday,
          course_id: entry.course_id ?? null,
          course_name: entry.course_name ?? "",
          lecturer_name: entry.lecturer_name ?? "",
          enrolled_count: entry.enrolled_count ?? 0,
          room_name: entry.room_name ?? "",
        }));
        setRoomSchedule(transformed);
      }
    };
    fetchSchedule();
  }, []);

  // Fetch schedule for Room B
  useEffect(() => {
    const fetchRoomB = async () => {
      const { data, error } = await supabase.rpc("get_room_schedule", {
        room_name_input: "B",
      });
      if (error) {
        console.error("Error loading room B schedule:", error);
      } else {
        const transformed = data.map((entry: any) => ({
          time_label: entry.label,
          weekday: entry.weekday,
          course_id: entry.course_id ?? null,
          course_name: entry.course_name ?? "",
          lecturer_name: entry.lecturer_name ?? "",
          enrolled_count: entry.enrolled_count ?? 0,
          room_name: entry.room_name ?? "",
        }));
        setRoomBSchedule(transformed);
      }
    };
    fetchRoomB();
  }, []);

  // Fetch schedule for Room C
  useEffect(() => {
    const fetchRoomC = async () => {
      const { data, error } = await supabase.rpc("get_room_schedule", {
        room_name_input: "C",
      });
      if (error) {
        console.error("Error loading room C schedule:", error);
      } else {
        const transformed = data.map((entry: any) => ({
          time_label: entry.label,
          weekday: entry.weekday,
          course_id: entry.course_id ?? null,
          course_name: entry.course_name ?? "",
          lecturer_name: entry.lecturer_name ?? "",
          enrolled_count: entry.enrolled_count ?? 0,
          room_name: entry.room_name ?? "",
        }));
        setRoomCSchedule(transformed);
      }
    };
    fetchRoomC();
  }, []);

  // Fetch schedule for Online room
  useEffect(() => {
    const fetchOnlineSchedule = async () => {
      const { data, error } = await supabase.rpc("get_room_schedule", {
        room_name_input: "Online",
      });
      if (error) {
        console.error("Error loading online room schedule:", error);
      } else {
        const transformed = data.map((entry: any) => ({
          time_label: entry.label,
          weekday: entry.weekday,
          course_id: entry.course_id ?? null,
          course_name: entry.course_name ?? "",
          lecturer_name: entry.lecturer_name ?? "",
          enrolled_count: entry.enrolled_count ?? 0,
          room_name: entry.room_name ?? "",
        }));
        setOnlineSchedule(transformed);
      }
    };
    fetchOnlineSchedule();
  }, []);

  // Show loading state until admin status is checked
  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  // Define fixed time slots for the schedule tables
  const timeSlots = [
    { label: "Slot 1", start: "08:15", end: "10:00" },
    { label: "Slot 2", start: "10:15", end: "12:00" },
    { label: "Slot 3", start: "12:15", end: "14:00" },
    { label: "Slot 4", start: "14:15", end: "16:00" },
    { label: "Slot 5", start: "16:15", end: "18:00" },
    { label: "Slot 6", start: "18:15", end: "20:00" },
    { label: "Slot 7", start: "20:15", end: "22:00" },
  ];

  return (
    <Tabs defaultValue="rooms" className="w-full">
      {/* Tabs navigation */}
      <TabsList className="flex justify-center gap-6 bg-blue-50 py-4 rounded-md shadow text-lg font-medium w-full mb-6">
        <TabsTrigger value="rooms" className="px-4 py-2 rounded hover:bg-blue-100">Room Overview</TabsTrigger>
        <TabsTrigger value="sql" className="px-4 py-2 rounded hover:bg-blue-100">SQL Editor</TabsTrigger>
      </TabsList>

      {/* SQL Editor tab */}
      <TabsContent value="sql">
        <div className="p-6 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-center">⚙️ SQL Editor</h1>
          <SqlEditor />
        </div>
      </TabsContent>

      {/* Room Overview tab */}
      <TabsContent value="rooms">
        <div className="overflow-x-auto max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">🏫 Room Overview</h2>

          {/* Room A Schedule Table */}
          <h3 className="text-xl font-semibold mb-2">Room A Schedule</h3>
          <table className="w-full table-auto border border-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Time</th>
                <th className="border px-4 py-2">Monday</th>
                <th className="border px-4 py-2">Tuesday</th>
                <th className="border px-4 py-2">Wednesday</th>
                <th className="border px-4 py-2">Thursday</th>
                <th className="border px-4 py-2">Friday</th>
              </tr>
            </thead>
            <tbody>
              {/* Iterate over time slots */}
              {timeSlots.map(({ label, start, end }) => (
                <tr key={label}>
                  {/* Time slot column */}
                  <td className="border px-2 py-2 font-bold w-32 whitespace-pre-line">
                    {start + "\n" + end}
                  </td>
                  {/* Weekday columns */}
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
                    // Find schedule entry matching time slot and weekday
                    const match = roomSchedule.find(
                      (entry) => entry.time_label === label && entry.weekday === day
                    );
                    return (
                      <td key={day} className="border px-2 py-2 w-[200px] align-top whitespace-normal">
                        {/* Display course info if found */}
                        {match ? (
                          <div>
                            <div><strong>Course:</strong> {match.course_id} - {match.course_name}</div>
                            <div><strong>Lecturer:</strong> {match.lecturer_name}</div>
                            <div><strong>Participants:</strong> {match.enrolled_count}</div>
                          </div>
                        ) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Room B Schedule Table */}
          <h3 className="text-xl font-semibold mt-16 mb-6">Room B Schedule</h3>
          <table className="w-full table-auto border border-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Time</th>
                <th className="border px-4 py-2">Monday</th>
                <th className="border px-4 py-2">Tuesday</th>
                <th className="border px-4 py-2">Wednesday</th>
                <th className="border px-4 py-2">Thursday</th>
                <th className="border px-4 py-2">Friday</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(({ label, start, end }) => (
                <tr key={label}>
                  <td className="border px-2 py-2 font-bold w-32 whitespace-pre-line">
                    {start + "\n" + end}
                  </td>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
                    const match = roomBSchedule.find(
                      (entry) => entry.time_label === label && entry.weekday === day
                    );
                    return (
                      <td key={day} className="border px-2 py-2 w-[200px] align-top whitespace-normal">
                        {match ? (
                          <div>
                            <div><strong>Course:</strong> {match.course_id} - {match.course_name}</div>
                            <div><strong>Lecturer:</strong> {match.lecturer_name}</div>
                            <div><strong>Participants:</strong> {match.enrolled_count}</div>
                          </div>
                        ) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Room C Schedule Table */}
          <h3 className="text-xl font-semibold mt-16 mb-6">Room C Schedule</h3>
          <table className="w-full table-auto border border-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Time</th>
                <th className="border px-4 py-2">Monday</th>
                <th className="border px-4 py-2">Tuesday</th>
                <th className="border px-4 py-2">Wednesday</th>
                <th className="border px-4 py-2">Thursday</th>
                <th className="border px-4 py-2">Friday</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(({ label, start, end }) => (
                <tr key={label}>
                  <td className="border px-2 py-2 font-bold w-32 whitespace-pre-line">
                    {start + "\n" + end}
                  </td>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
                    const match = roomCSchedule.find(
                      (entry) => entry.time_label === label && entry.weekday === day
                    );
                    return (
                      <td key={day} className="border px-2 py-2 w-[200px] align-top whitespace-normal">
                        {match ? (
                          <div>
                            <div><strong>Course:</strong> {match.course_id} - {match.course_name}</div>
                            <div><strong>Lecturer:</strong> {match.lecturer_name}</div>
                            <div><strong>Participants:</strong> {match.enrolled_count}</div>
                          </div>
                        ) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Online Room Schedule Table */}
          <h3 className="text-xl font-semibold mt-16 mb-6">Online Room Schedule</h3>
          <table className="w-full table-auto border border-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Time</th>
                <th className="border px-4 py-2">Monday</th>
                <th className="border px-4 py-2">Tuesday</th>
                <th className="border px-4 py-2">Wednesday</th>
                <th className="border px-4 py-2">Thursday</th>
                <th className="border px-4 py-2">Friday</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(({ label, start, end }) => (
                <tr key={label}>
                  <td className="border px-2 py-2 font-bold w-32 whitespace-pre-line">
                    {start + "\n" + end}
                  </td>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
                    // Multiple courses can be scheduled online at the same time and day
                    const matches = onlineSchedule.filter(
                      (entry) => entry.time_label === label && entry.weekday === day
                    );
                    return (
                      <td key={day} className="border px-2 py-2 w-[200px] align-top whitespace-normal">
                        {/* Display all matching courses sequentially */}
                        {matches.length > 0 ? (
                          matches.map((match, idx) => (
                            <div key={idx} className="mb-2 pb-2 border-b border-gray-300 last:border-b-0 last:pb-0">
                              <div><strong>Course:</strong> {match.course_id} - {match.course_name}</div>
                              <div><strong>Lecturer:</strong> {match.lecturer_name}</div>
                              <div><strong>Participants:</strong> {match.enrolled_count}</div>
                            </div>
                          ))
                        ) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}