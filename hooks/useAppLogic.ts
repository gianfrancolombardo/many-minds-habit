
import { useState, useEffect, useRef } from 'react';
import { AppState, Profile, Habit } from '../types';
import { generateId, calculateStreak, getTodayISO } from '../utils/helpers';
import { pool } from '../lib/neon';

// Estado inicial limpio (fallback si no hay DB)
const DEFAULT_PROFILE: Profile = {
  id: 'default-1',
  name: 'Mis Hábitos',
  themeColor: 'teal',
  habits: []
};

const INITIAL_STATE: AppState = {
  profiles: [DEFAULT_PROFILE],
  activeProfileId: DEFAULT_PROFILE.id,
};

export const useAppLogic = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- CARGA DE DATOS RELACIONALES (SELECT + JOIN en JS) ---
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        setIsLoading(true);
        
        // 1. Traer Perfiles
        const profilesResult = await pool.query('SELECT * FROM profiles ORDER BY created_at ASC');
        
        // Si no hay perfiles en la DB, creamos el default y lo guardamos
        if (profilesResult.rows.length === 0) {
           console.log("Base de datos vacía. Inicializando perfil por defecto...");
           
           // Insertar en DB
           await pool.query(
             'INSERT INTO profiles (id, name, theme_color) VALUES ($1, $2, $3)',
             [DEFAULT_PROFILE.id, DEFAULT_PROFILE.name, DEFAULT_PROFILE.themeColor]
           );

           // Actualizar estado local
           setState({
             profiles: [DEFAULT_PROFILE],
             activeProfileId: DEFAULT_PROFILE.id
           });
           
           setIsLoading(false);
           return;
        }

        // 2. Traer todos los Hábitos
        const habitsResult = await pool.query('SELECT * FROM habits ORDER BY position ASC');
        
        // 3. Traer todas las Completions
        // (Para una app real con millones de filas, filtraríamos por rango de fecha, pero aquí traemos todo para calcular streaks)
        const completionsResult = await pool.query('SELECT habit_id, to_char(completed_date, \'YYYY-MM-DD\') as date FROM habit_completions');

        // 4. Reconstruir el Árbol de Estado (Relational -> Object Tree)
        const loadedProfiles: Profile[] = profilesResult.rows.map((row: any) => {
            // Filtrar hábitos para este perfil
            const profileHabits = habitsResult.rows
                .filter((h: any) => h.profile_id === row.id)
                .map((h: any) => {
                    // Filtrar fechas para este hábito
                    const dates = completionsResult.rows
                        .filter((c: any) => c.habit_id === h.id)
                        .map((c: any) => c.date);
                    
                    return {
                        id: h.id,
                        title: h.title,
                        icon: h.icon || '📝',
                        completedDates: dates,
                        streak: calculateStreak(dates) // Recalculamos streak en el cliente
                    } as Habit;
                });

            return {
                id: row.id,
                name: row.name,
                themeColor: row.theme_color,
                habits: profileHabits
            };
        });

        setState({
            profiles: loadedProfiles,
            activeProfileId: loadedProfiles[0]?.id || DEFAULT_PROFILE.id
        });

      } catch (error) {
        console.error("Error cargando desde SQL:", error);
        // Fallback a localStorage si la DB falla
        const local = localStorage.getItem('atomic-daily-backup');
        if (local) setState(JSON.parse(local));
      } finally {
        setIsLoading(false);
      }
    };

    loadFromDB();
  }, []);

  // Backup local simple por seguridad (no bloqueante)
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('atomic-daily-backup', JSON.stringify(state));
    }
  }, [state, isLoading]);

  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0] || DEFAULT_PROFILE;

  // --- ACCIONES CON SQL GRANULAR ---

  const setActiveProfile = (id: string) => {
    setState(prev => ({ ...prev, activeProfileId: id }));
  };

  const addProfile = async (name: string, color: string) => {
    const newProfile: Profile = {
      id: generateId(),
      name,
      themeColor: color,
      habits: []
    };
    
    // Optimistic Update
    setState(prev => ({
      ...prev,
      profiles: [...prev.profiles, newProfile],
      activeProfileId: newProfile.id
    }));

    // SQL Insert
    try {
        await pool.query(
            'INSERT INTO profiles (id, name, theme_color) VALUES ($1, $2, $3)',
            [newProfile.id, newProfile.name, newProfile.themeColor]
        );
    } catch (e) {
        console.error("Error SQL addProfile:", e);
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    // Optimistic Update
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => p.id === id ? { ...p, ...updates } : p)
    }));

    // SQL Update
    try {
        if (updates.name || updates.themeColor) {
            // Construimos query dinámico simple o asumimos update completo de campos editables
            const current = state.profiles.find(p => p.id === id);
            await pool.query(
                'UPDATE profiles SET name = $1, theme_color = $2 WHERE id = $3',
                [updates.name || current?.name, updates.themeColor || current?.themeColor, id]
            );
        }
    } catch (e) {
        console.error("Error SQL updateProfile:", e);
    }
  };
  
  const deleteProfile = async (id: string) => {
    if (state.profiles.length <= 1) return; 
    
    // Optimistic Update
    setState(prev => {
        const newProfiles = prev.profiles.filter(p => p.id !== id);
        const nextActiveId = prev.activeProfileId === id ? newProfiles[0].id : prev.activeProfileId;
        return {
            profiles: newProfiles,
            activeProfileId: nextActiveId
        };
    });

    // SQL Delete (ON DELETE CASCADE se encargará de hábitos y completions)
    try {
        await pool.query('DELETE FROM profiles WHERE id = $1', [id]);
    } catch (e) {
        console.error("Error SQL deleteProfile:", e);
    }
  };

  const addHabit = async (title: string, icon: string) => {
    const newHabit: Habit = {
      id: generateId(),
      title,
      icon: icon || '📝',
      streak: 0,
      completedDates: []
    };

    const currentProfileId = state.activeProfileId;
    const currentHabitCount = activeProfile.habits.length;

    // Optimistic Update
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => {
        if (p.id === currentProfileId) {
          return { ...p, habits: [...p.habits, newHabit] };
        }
        return p;
      })
    }));

    // SQL Insert
    try {
        await pool.query(
            'INSERT INTO habits (id, profile_id, title, icon, position) VALUES ($1, $2, $3, $4, $5)',
            [newHabit.id, currentProfileId, newHabit.title, newHabit.icon, currentHabitCount]
        );
    } catch (e) {
        console.error("Error SQL addHabit:", e);
    }
  };

  const editHabit = async (habitId: string, title: string, icon: string) => {
    // Optimistic Update
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        const updatedHabits = p.habits.map(h => 
          h.id === habitId ? { ...h, title, icon } : h
        );
        return { ...p, habits: updatedHabits };
      })
    }));

    // SQL Update
    try {
        await pool.query(
            'UPDATE habits SET title = $1, icon = $2 WHERE id = $3',
            [title, icon, habitId]
        );
    } catch (e) {
        console.error("Error SQL editHabit:", e);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const today = getTodayISO();
    let action: 'INSERT' | 'DELETE' = 'INSERT';

    // Optimistic Update & Logic Calculation
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;

        const updatedHabits = p.habits.map(h => {
          if (h.id !== habitId) return h;

          const isCompleted = h.completedDates.includes(today);
          let newDates;
          
          if (isCompleted) {
            newDates = h.completedDates.filter(d => d !== today);
            action = 'DELETE';
          } else {
            newDates = [...h.completedDates, today];
            action = 'INSERT';
          }

          return {
            ...h,
            completedDates: newDates,
            streak: calculateStreak(newDates)
          };
        });
        return { ...p, habits: updatedHabits };
      })
    }));

    // SQL Operation
    try {
        if (action === 'INSERT') {
            await pool.query(
                'INSERT INTO habit_completions (habit_id, completed_date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [habitId, today]
            );
        } else {
            await pool.query(
                'DELETE FROM habit_completions WHERE habit_id = $1 AND completed_date = $2',
                [habitId, today]
            );
        }
    } catch (e) {
        console.error("Error SQL toggleHabit:", e);
    }
  };

  const deleteHabit = async (habitId: string) => {
    // Optimistic Update
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return { ...p, habits: p.habits.filter(h => h.id !== habitId) };
      })
    }));

    // SQL Delete
    try {
        await pool.query('DELETE FROM habits WHERE id = $1', [habitId]);
    } catch (e) {
        console.error("Error SQL deleteHabit:", e);
    }
  };

  const reorderHabits = async (newHabits: Habit[]) => {
    // Optimistic Update
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return { ...p, habits: newHabits };
      })
    }));

    // SQL Update (Batch)
    // Nota: Esto lanza múltiples updates. Para producción, usaríamos una transacción o un query complejo.
    // Para este demo, un loop de promesas es aceptable y mantiene el código legible.
    try {
        const promises = newHabits.map((habit, index) => 
            pool.query('UPDATE habits SET position = $1 WHERE id = $2', [index, habit.id])
        );
        await Promise.all(promises);
    } catch (e) {
        console.error("Error SQL reorderHabits:", e);
    }
  };

  return {
    state,
    isLoading,
    activeProfile,
    setActiveProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    addHabit,
    editHabit,
    toggleHabit,
    deleteHabit,
    reorderHabits
  };
};
