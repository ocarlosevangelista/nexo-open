import React, { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function UIProvider({ children }) {
  const [createTask, setCreateTask] = useState(null);
  const [createProject, setCreateProject] = useState(false);
  const [importCalendar, setImportCalendar] = useState(false);
  return <Ctx.Provider value={{ createTask, setCreateTask, createProject, setCreateProject, importCalendar, setImportCalendar }}>{children}</Ctx.Provider>;
}

export const useUI = () => useContext(Ctx);