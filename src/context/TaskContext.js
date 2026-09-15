/**
 * React concept: Context + useEffect
 *
 * Tasks and lists load/save through the Express API (PostgreSQL).
 * Subtasks, notes, and completedAt stay in AsyncStorage until those tables have routes.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { DEFAULT_LISTS, normalizeTask } from '@/constants/lists';
import {
  createList as apiCreateList,
  createTask as apiCreateTask,
  deleteList as apiDeleteList,
  deleteTask as apiDeleteTask,
  getLists,
  getTasks,
  updateList as apiUpdateList,
  updateTask as apiUpdateTask,
} from '@/utils/api';
import { confirmDelete } from '@/utils/confirmDelete';

const EXTRAS_KEY = '@todo/task-extras';
const SELECTED_KEY = '@todo/selected-list';
const UNDO_MS = 5000;
const DEFAULT_LIST_NAMES = DEFAULT_LISTS.map((list) => list.name);

function mapList(row) {
  return { id: String(row.id), name: row.name };
}

function mapTask(row, extra = {}, fallbackListId) {
  const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
  return normalizeTask({
    id: String(row.id),
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    completedAt: extra.completedAt || (row.completed ? row.created_at : null),
    priority: row.priority || 'medium',
    category: row.category || 'personal',
    dueDate: due,
    notes: extra.notes || '',
    listId: row.list_id != null ? String(row.list_id) : fallbackListId,
    subtasks: Array.isArray(extra.subtasks) ? extra.subtasks : [],
  });
}

function extrasFromTasks(taskList) {
  return Object.fromEntries(
    taskList.map((task) => [
      String(task.id),
      {
        notes: task.notes || '',
        subtasks: task.subtasks || [],
        completedAt: task.completedAt || null,
      },
    ])
  );
}

function payloadFromTask(task) {
  return {
    list_id: task.listId ? Number(task.listId) : null,
    text: task.text,
    completed: Boolean(task.completed),
    priority: task.priority || 'medium',
    category: task.category || null,
    due_date: task.dueDate || null,
  };
}

function payloadFromPatch(patch) {
  const body = {};
  if (patch.text !== undefined) {
    body.text = patch.text;
  }
  if (patch.completed !== undefined) {
    body.completed = patch.completed;
  }
  if (patch.priority !== undefined) {
    body.priority = patch.priority;
  }
  if (patch.category !== undefined) {
    body.category = patch.category;
  }
  if (patch.dueDate !== undefined) {
    body.due_date = patch.dueDate;
  }
  if (patch.listId !== undefined) {
    body.list_id = patch.listId ? Number(patch.listId) : null;
  }
  return body;
}

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);
  const extrasReady = useRef(false);

  const loadFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [savedSelected, extrasRaw, apiLists, apiTasks] = await Promise.all([
        AsyncStorage.getItem(SELECTED_KEY),
        AsyncStorage.getItem(EXTRAS_KEY),
        getLists(),
        getTasks(),
      ]);

      let listRows = Array.isArray(apiLists) ? apiLists : [];
      if (listRows.length === 0) {
        listRows = [];
        for (const name of DEFAULT_LIST_NAMES) {
          listRows.push(await apiCreateList({ name }));
        }
      }

      const mappedLists = listRows.map(mapList);
      const extras = extrasRaw ? JSON.parse(extrasRaw) : {};
      const fallbackListId = mappedLists[0]?.id;
      const mappedTasks = (Array.isArray(apiTasks) ? apiTasks : []).map((row) =>
        mapTask(row, extras[String(row.id)] || {}, fallbackListId)
      );

      const preferred =
        savedSelected && mappedLists.some((list) => list.id === savedSelected)
          ? savedSelected
          : mappedLists.find((list) => list.name === 'Personal')?.id || fallbackListId;

      setLists(mappedLists);
      setTasks(mappedTasks);
      setSelectedListId(preferred || null);
      extrasReady.current = true;
    } catch (err) {
      setError(err.message || 'Could not load tasks from the server.');
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  useEffect(() => {
    if (!selectedListId) {
      return;
    }
    AsyncStorage.setItem(SELECTED_KEY, selectedListId).catch(() => {});
  }, [selectedListId]);

  useEffect(() => {
    if (!extrasReady.current) {
      return;
    }
    AsyncStorage.setItem(EXTRAS_KEY, JSON.stringify(extrasFromTasks(tasks))).catch((err) => {
      console.warn('Could not save local task extras', err);
    });
  }, [tasks]);

  function scheduleUndoClear() {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
    }
    undoTimer.current = setTimeout(() => setUndoItem(null), UNDO_MS);
  }

  const value = useMemo(() => {
    async function addTask({ text, priority = 'medium', category = 'personal', dueDate = null }) {
      try {
        const row = await apiCreateTask({
          list_id: selectedListId ? Number(selectedListId) : null,
          text,
          completed: false,
          priority,
          category,
          due_date: dueDate,
        });
        setTasks((current) => [...current, mapTask(row, {}, selectedListId)]);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function updateTask(id, patch) {
      const body = payloadFromPatch(patch);
      try {
        if (Object.keys(body).length > 0) {
          await apiUpdateTask(id, body);
        }
        setTasks((current) =>
          current.map((task) => (task.id === id ? { ...task, ...patch } : task))
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      const willComplete = task && !task.completed;
      if (willComplete) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          // Web / unsupported devices can ignore haptics.
        }
      }
      const completed = !task?.completed;
      const completedAt = completed ? new Date().toISOString() : null;
      try {
        await apiUpdateTask(id, { completed });
        setTasks((current) =>
          current.map((item) => (item.id === id ? { ...item, completed, completedAt } : item))
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function removeTask(id) {
      const found = tasks.find((task) => task.id === id);
      try {
        await apiDeleteTask(id);
        setTasks((current) => current.filter((task) => task.id !== id));
        if (found) {
          setUndoItem(found);
          scheduleUndoClear();
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    function requestDelete(id, { onCancel } = {}) {
      confirmDelete({
        onConfirm: () => removeTask(id),
        onCancel,
      });
    }

    async function undoDelete() {
      if (!undoItem) {
        return;
      }
      const snapshot = undoItem;
      setUndoItem(null);
      if (undoTimer.current) {
        clearTimeout(undoTimer.current);
      }
      try {
        const row = await apiCreateTask(payloadFromTask(snapshot));
        setTasks((current) => [
          mapTask(
            row,
            { notes: snapshot.notes, subtasks: snapshot.subtasks, completedAt: snapshot.completedAt },
            selectedListId
          ),
          ...current.filter((task) => task.id !== snapshot.id),
        ]);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function clearCompleted() {
      const done = tasks.filter((task) => task.listId === selectedListId && task.completed);
      try {
        await Promise.all(done.map((task) => apiDeleteTask(task.id)));
        const gone = new Set(done.map((task) => task.id));
        setTasks((current) => current.filter((task) => !gone.has(task.id)));
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    function addSubtask(taskId, text) {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: [
                  ...(task.subtasks || []),
                  { id: `${Date.now()}`, text: trimmed, completed: false },
                ],
              }
            : task
        )
      );
    }

    function toggleSubtask(taskId, subtaskId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: (task.subtasks || []).map((sub) =>
                  sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
                ),
              }
            : task
        )
      );
    }

    function deleteSubtask(taskId, subtaskId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: (task.subtasks || []).filter((sub) => sub.id !== subtaskId),
              }
            : task
        )
      );
    }

    async function createList(name) {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      try {
        const row = await apiCreateList({ name: trimmed });
        const list = mapList(row);
        setLists((current) => [...current, list]);
        setSelectedListId(list.id);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function renameList(id, name) {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      try {
        await apiUpdateList(id, { name: trimmed });
        setLists((current) =>
          current.map((list) => (list.id === id ? { ...list, name: trimmed } : list))
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function deleteList(id) {
      if (lists.length <= 1) {
        return;
      }
      const remaining = lists.filter((list) => list.id !== id);
      const fallbackId = remaining[0].id;
      try {
        await apiDeleteList(id);
        const moved = tasks.filter((task) => task.listId === id);
        await Promise.all(moved.map((task) => apiUpdateTask(task.id, { list_id: Number(fallbackId) })));
        setLists(remaining);
        setTasks((current) =>
          current.map((task) => (task.listId === id ? { ...task, listId: fallbackId } : task))
        );
        if (selectedListId === id) {
          setSelectedListId(fallbackId);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const completedThisWeek = tasks.filter((task) => {
      if (!task.completedAt) {
        return false;
      }
      return new Date(task.completedAt).getTime() >= weekAgo;
    }).length;

    const selectedList = lists.find((list) => list.id === selectedListId) || lists[0];

    return {
      tasks,
      lists,
      selectedListId,
      selectedList,
      hydrated,
      loading,
      error,
      reload: loadFromApi,
      undoItem,
      completedThisWeek,
      addTask,
      updateTask,
      toggleTask,
      requestDelete,
      undoDelete,
      clearCompleted,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      createList,
      renameList,
      deleteList,
      selectList: setSelectedListId,
    };
  }, [tasks, lists, selectedListId, hydrated, loading, error, undoItem, loadFromApi]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used inside TaskProvider');
  }
  return context;
}
