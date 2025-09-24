/*
 * VividTodo - Core Application Logic
 * Implements Todo model, TodoStore, rendering, event handling, and drag-and-drop.
 */

// ---------------------------------------------------------------------------
// Constants – DOM elements
// ---------------------------------------------------------------------------
const newTodoInput = document.querySelector('#new-todo');
const todoList = document.querySelector('#todo-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.querySelector('#clear-completed');

let currentFilter = 'all'; // default filter
let draggedTodoId = null; // used during drag‑and‑drop

// ---------------------------------------------------------------------------
// Todo Model
// ---------------------------------------------------------------------------
class Todo {
  /**
   * @param {string|number} id - Unique identifier for the todo.
   * @param {string} text - The todo text.
   * @param {boolean} [completed=false] - Completion state.
   */
  constructor(id, text, completed = false) {
    this.id = id;
    this.text = text;
    this.completed = completed;
  }

  toggle() {
    this.completed = !this.completed;
  }

  setText(newText) {
    this.text = newText;
  }
}

// ---------------------------------------------------------------------------
// TodoStore – manages collection and persistence
// ---------------------------------------------------------------------------
const TodoStore = {
  _todos: [], // internal array of Todo instances

  _storageKey: 'vividTodoItems',

  // ---------- Persistence ----------
  loadFromStorage() {
    const raw = localStorage.getItem(this._storageKey);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        // Re‑hydrate plain objects into Todo instances
        this._todos = data.map(item => new Todo(item.id, item.text, item.completed));
      } catch (e) {
        console.error('Failed to parse stored todos:', e);
        this._todos = [];
      }
    } else {
      this._todos = [];
    }
  },

  saveToStorage() {
    const data = this._todos.map(t => ({ id: t.id, text: t.text, completed: t.completed }));
    localStorage.setItem(this._storageKey, JSON.stringify(data));
  },

  // ---------- CRUD Operations ----------
  addTodo(text) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const todo = new Todo(id, text);
    this._todos.push(todo);
    this.saveToStorage();
    return todo;
  },

  editTodo(id, newText) {
    const todo = this._todos.find(t => t.id === id);
    if (todo) {
      todo.setText(newText);
      this.saveToStorage();
    }
  },

  toggleTodo(id) {
    const todo = this._todos.find(t => t.id === id);
    if (todo) {
      todo.toggle();
      this.saveToStorage();
    }
  },

  deleteTodo(id) {
    const index = this._todos.findIndex(t => t.id === id);
    if (index !== -1) {
      this._todos.splice(index, 1);
      this.saveToStorage();
    }
  },

  clearCompleted() {
    this._todos = this._todos.filter(t => !t.completed);
    this.saveToStorage();
  },

  // ---------- Filtering ----------
  filterTodos(filter) {
    switch (filter) {
      case 'active':
        return this._todos.filter(t => !t.completed);
      case 'completed':
        return this._todos.filter(t => t.completed);
      case 'all':
      default:
        return this._todos.slice(); // shallow copy
    }
  },

  // ---------- Re‑ordering ----------
  reorderTodos(draggedId, targetId) {
    if (draggedId === targetId) return;
    const draggedIdx = this._todos.findIndex(t => t.id === draggedId);
    const targetIdx = this._todos.findIndex(t => t.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const [draggedItem] = this._todos.splice(draggedIdx, 1);
    // Adjust target index if the removal was before it
    const insertIdx = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
    this._todos.splice(insertIdx, 0, draggedItem);
    this.saveToStorage();
  },
};

// Expose globally for potential external use
window.TodoStore = TodoStore;

// ---------------------------------------------------------------------------
// Rendering Helpers
// ---------------------------------------------------------------------------
/**
 * Creates a DOM <li> element representing a single todo item.
 * @param {Todo} todo
 * @returns {HTMLElement}
 */
function renderTodoItem(todo) {
  const li = document.createElement('li');
  li.dataset.id = todo.id;
  li.className = 'todo-item' + (todo.completed ? ' completed' : '');
  li.setAttribute('draggable', 'true');

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.setAttribute('aria-label', 'Mark todo as completed');

  // Text span (editable)
  const span = document.createElement('span');
  span.textContent = todo.text;
  span.contentEditable = 'true';
  span.setAttribute('role', 'textbox');
  span.setAttribute('aria-label', 'Edit todo');

  // Delete button
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.setAttribute('aria-label', 'Delete todo');

  // Append children
  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(delBtn);

  // ----- Event Listeners -----
  // Toggle completion
  checkbox.addEventListener('change', () => {
    TodoStore.toggleTodo(todo.id);
    renderTodoList(currentFilter);
  });

  // Inline edit – on blur
  span.addEventListener('blur', () => {
    const newText = span.textContent.trim();
    if (newText && newText !== todo.text) {
      TodoStore.editTodo(todo.id, newText);
      renderTodoList(currentFilter);
    } else {
      // Reset displayed text if empty or unchanged
      span.textContent = todo.text;
    }
  });

  // Delete
  delBtn.addEventListener('click', () => {
    TodoStore.deleteTodo(todo.id);
    renderTodoList(currentFilter);
  });

  // ----- Drag & Drop -----
  li.addEventListener('dragstart', e => {
    draggedTodoId = todo.id;
    e.dataTransfer.effectAllowed = 'move';
    // Some browsers require data to be set
    e.dataTransfer.setData('text/plain', todo.id);
    li.classList.add('dragging');
  });

  li.addEventListener('dragend', () => {
    draggedTodoId = null;
    li.classList.remove('dragging');
    // Clean any leftover placeholder styling
    document.querySelectorAll('.placeholder').forEach(el => el.classList.remove('placeholder'));
  });

  li.addEventListener('dragover', e => {
    e.preventDefault(); // Necessary to allow drop
    e.dataTransfer.dropEffect = 'move';
  });

  li.addEventListener('dragenter', e => {
    e.preventDefault();
    if (li.dataset.id !== draggedTodoId) {
      li.classList.add('placeholder');
    }
  });

  li.addEventListener('dragleave', () => {
    li.classList.remove('placeholder');
  });

  li.addEventListener('drop', e => {
    e.preventDefault();
    li.classList.remove('placeholder');
    const targetId = li.dataset.id;
    if (draggedTodoId && targetId) {
      TodoStore.reorderTodos(draggedTodoId, targetId);
      renderTodoList(currentFilter);
    }
  });

  return li;
}

/**
 * Renders the todo list according to the supplied filter.
 * @param {string} filter - "all", "active" or "completed"
 */
function renderTodoList(filter = 'all') {
  // Clear existing items
  todoList.innerHTML = '';
  const items = TodoStore.filterTodos(filter);
  items.forEach(todo => {
    const li = renderTodoItem(todo);
    todoList.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// UI Event Wiring
// ---------------------------------------------------------------------------
// Add new todo via Enter key
newTodoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const text = newTodoInput.value.trim();
    if (text) {
      TodoStore.addTodo(text);
      newTodoInput.value = '';
      renderTodoList(currentFilter);
    }
  }
});

// Filter buttons
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active state
    filterButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentFilter = btn.dataset.filter;
    renderTodoList(currentFilter);
  });
});

// Clear completed button
clearCompletedBtn.addEventListener('click', () => {
  TodoStore.clearCompleted();
  renderTodoList(currentFilter);
});

// ---------------------------------------------------------------------------
// Application Initialization
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  TodoStore.loadFromStorage();
  currentFilter = 'all';
  renderTodoList(currentFilter);
  newTodoInput.focus();
});
