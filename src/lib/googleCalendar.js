import { base44 } from '@/api/base44Client';

// Identificador do conector; a edge function `google-calendar` do Supabase faz o OAuth.
export const GCAL_CONNECTOR_ID = 'google-calendar';
// Marca que o usuário saiu para o OAuth do Google, para reabrir a importação na volta.
export const GCAL_RETURN_KEY = 'nexo:gcal:return';

const call = async (action, params = {}) => (await base44.functions.invoke('googleCalendar', { action, ...params })).data;

export const gcalStatus = async () => {
  try { return await call('status'); } catch { return { connected: false, unavailable: true }; }
};
export const gcalCalendars = () => call('calendars');
export const gcalEvents = (calendarId, timeMin, timeMax) => call('events', { calendarId, timeMin, timeMax });

export async function gcalConnect() {
  try { sessionStorage.setItem(GCAL_RETURN_KEY, window.location.pathname + window.location.search); } catch { /* sem storage */ }
  window.location.href = await base44.connectors.connectAppUser(GCAL_CONNECTOR_ID);
}

export const gcalDisconnect = () => base44.connectors.disconnectAppUser(GCAL_CONNECTOR_ID);