import { useEffect, useRef } from 'react';
import { supabase, PROJECT_ID } from '../lib/supabase';

export function useDeviceSession(roomId: string | null, role: string) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const registerSession = async () => {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timestamp: new Date().toISOString(),
      };

      const { data } = await supabase
        .from('device_sessions')
        .insert({
          room_id: roomId,
          role,
          device_info: deviceInfo,
          project_id: PROJECT_ID,
        })
        .select()
        .single();

      if (data) {
        sessionIdRef.current = data.id;
      }
    };

    const updateSession = async () => {
      if (!sessionIdRef.current) return;

      await supabase
        .from('device_sessions')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', sessionIdRef.current);
    };

    registerSession();

    const heartbeatInterval = setInterval(updateSession, 30000);

    const handleBeforeUnload = async () => {
      if (sessionIdRef.current) {
        await supabase
          .from('device_sessions')
          .delete()
          .eq('id', sessionIdRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [roomId, role]);
}
