/**
 * React concept: Context + useEffect
 *
 * Tasks, lists, notes, completedAt, and subtasks load/save through the API.
 * Selected list stays in memory (not a shared DB concern).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { DEFAULT_LISTS, normalizeTask } from '@/constants/lists';
import { useUser } from '@/context/UserContext';
import {
  addSubtask as apiAddSubtask,
  createList as apiCreateList,
  createTask as apiCreateTask,
  deleteList as apiDeleteList,
  deleteSubtask as apiDeleteSubtask,
  deleteTask as apiDeleteTask,
  getLists,
  getTasks,
  setApiUserId,
  updateList as apiUpdateList,
  updateSubtask as apiUpdateSubtask,
  updateTask as apiUpdateTask,
} from '@/utils/api';
import { confirmDelete } from '@/utils/confirmDelete';
import { pickNextPhrase } from '@/utils/motivationalPhrases';

const UNDO_MS = 5000;
const DEFAULT_LIST_NAMES = DEFAULT_LISTS.map((list) => list.name);

function mapList(row) {
  return { id: String(row.id), name: row.name };
}

function mapSubtask(row) {
  return {
    id: String(row.id),
    text: row.text,
    completed: Boolean(row.completed),
  };
}

function mapTask(row, fallbackListId) {
  const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
  const completedAt = row.completed_at || (row.completed ? row.created_at : null);
  return normalizeTask({
    id: String(row.id),
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    completedAt,
    priority: row.priority || 'medium',
    category: row.category || 'personal',
    dueDate: due,
    notes: row.notes || '',
    imageUri: row.image_uri || '',
    listId: row.list_id != null ? String(row.list_id) : fallbackListId,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks.map(mapSubtask) : [],
  });
}

function payloadFromTask(task) {
  return {
    list_id: task.listId ? Number(task.listId) : null,
    text: task.text,
    completed: Boolean(task.completed),
    priority: task.priority || 'medium',
    category: task.category || null,
    due_date: task.dueDate || null,
    notes: task.notes || '',
    completed_at: task.completedAt || null,
    image_uri: task.imageUri || null,
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
  if (patch.notes !== undefined) {
    body.notes = patch.notes;
  }
  if (patch.completedAt !== undefined) {
    body.completed_at = patch.completedAt;
  }
  if (patch.imageUri !== undefined) {
    body.image_uri = patch.imageUri || '';
  }
  return body;
}

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const { userId, hydrated: userHydrated } = useUser();
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [undoItem, setUndoItem] = useState(null);
  const [motivation, setMotivation] = useState(null);
  const undoTimer = useRef(null);
  const lastPhrase = useRef('');

  const loadFromApi = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setHydrated(true);
      return;
    }
    setApiUserId(userId);
    setLoading(true);
    setError(null);
    try {
      const [apiLists, apiTasks] = await Promise.all([getLists(), getTasks()]);

      let listRows = Array.isArray(apiLists) ? apiLists : [];
      if (listRows.length === 0) {
        listRows = [];
        for (const name of DEFAULT_LIST_NAMES) {
          listRows.push(await apiCreateList({ name }));
        }
      }

      const mappedLists = listRows.map(mapList);
      const fallbackListId = mappedLists[0]?.id;
      const mappedTasks = (Array.isArray(apiTasks) ? apiTasks : []).map((row) =>
        mapTask(row, fallbackListId)
      );

      const preferred =
        mappedLists.find((list) => list.id === selectedListId)?.id ||
        mappedLists.find((list) => list.name === 'Personal')?.id ||
        fallbackListId;

      setLists(mappedLists);
      setTasks(mappedTasks);
      setSelectedListId(preferred || null);
    } catch (err) {
      setError(err.message || 'Could not load tasks from the server.');
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, [userId]);

  useEffect(() => {
    if (!userHydrated) {
      return;
    }
    loadFromApi();
    // Reload when the signed-in user changes, not on every list tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userHydrated, userId]);

  function scheduleUndoClear() {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
    }
    undoTimer.current = setTimeout(() => setUndoItem(null), UNDO_MS);
  }

  const value = useMemo(() => {
    async function addTask({ text, priority = 'medium', category = 'personal', dueDate = null, imageUri = '' }) {
      try {
        const row = await apiCreateTask({
          list_id: selectedListId ? Number(selectedListId) : null,
          text,
          completed: false,
          priority,
          category,
          due_date: dueDate,
          image_uri: imageUri || null,
        });
        setTasks((current) => [...current, mapTask(row, selectedListId)]);
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
        if (patch.completed === true) {
          const phrase = pickNextPhrase(lastPhrase.current);
          lastPhrase.current = phrase;
          setMotivation(phrase);
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
        await apiUpdateTask(id, { completed, completed_at: completedAt });
        setTasks((current) =>
          current.map((item) => (item.id === id ? { ...item, completed, completedAt } : item))
        );
        if (completed) {
          const phrase = pickNextPhrase(lastPhrase.current);
          lastPhrase.current = phrase;
          setMotivation(phrase);
        }
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
        const restored = mapTask(row, selectedListId);
        const kids = snapshot.subtasks || [];
        const createdSubs = [];
        for (const sub of kids) {
          const saved = await apiAddSubtask(restored.id, {
            text: sub.text,
            completed: Boolean(sub.completed),
          });
          createdSubs.push(mapSubtask(saved));
        }
        setTasks((current) => [
          { ...restored, notes: snapshot.notes || restored.notes, subtasks: createdSubs },
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

    async function addSubtask(taskId, text) {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      try {
        const row = await apiAddSubtask(taskId, { text: trimmed, completed: false });
        const mapped = mapSubtask(row);
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? { ...task, subtasks: [...(task.subtasks || []), mapped] }
              : task
          )
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function toggleSubtask(taskId, subtaskId) {
      const parent = tasks.find((task) => task.id === taskId);
      const sub = parent?.subtasks?.find((item) => item.id === subtaskId);
      const nextCompleted = !sub?.completed;
      try {
        await apiUpdateSubtask(subtaskId, { completed: nextCompleted });
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: (task.subtasks || []).map((item) =>
                    item.id === subtaskId ? { ...item, completed: nextCompleted } : item
                  ),
                }
              : task
          )
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }

    async function deleteSubtask(taskId, subtaskId) {
      try {
        await apiDeleteSubtask(subtaskId);
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: (task.subtasks || []).filter((item) => item.id !== subtaskId),
                }
              : task
          )
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      }
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
      motivation,
      clearMotivation: () => setMotivation(null),
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
  }, [tasks, lists, selectedListId, hydrated, loading, error, undoItem, motivation, loadFromApi]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used inside TaskProvider');
  }
  return context;
}
