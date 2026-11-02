let config = null;
let editingId = null; // id of task being edited, null = adding new task

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-description');
const submitBtn = document.getElementById('task-submit');
const taskList = document.getElementById('task-list');
const statusMsg = document.getElementById('status-message');

function showStatus(text) {
  statusMsg.textContent = text;
}

function apiUrl(query) {
  return config.supabaseUrl + '/rest/v1/' + config.tableName + query;
}

function headers() {
  return {
    'apikey': config.supabasePublishableKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

// GET all tasks
async function loadTasks() {
  try {
    const res = await fetch(apiUrl('?select=*&order=id.asc'), { headers: headers() });
    if (!res.ok) throw new Error('Could not load tasks (' + res.status + ')');
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    showStatus('Error: ' + err.message);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.textContent = 'No tasks yet.';
    return;
  }

  tasks.forEach(function (task) {
    const item = document.createElement('div');
    item.className = 'task-item';
    if (task.completed) item.classList.add('done');
    item.dataset.id = task.id;

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const desc = document.createElement('p');
    desc.className = 'task-description';
    desc.textContent = task.description || '';

    const status = document.createElement('p');
    status.className = 'task-status';
    status.textContent = task.completed ? 'Completed' : 'Not completed';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-task';
    toggleBtn.textContent = task.completed ? 'Mark incomplete' : 'Mark complete';
    toggleBtn.addEventListener('click', function () {
      toggleTask(task);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-task';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function () {
      startEdit(task);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function () {
      deleteTask(task.id);
    });

    item.append(title, desc, status, toggleBtn, editBtn, deleteBtn);
    taskList.appendChild(item);
  });
}

// POST new task
async function addTask(title, description) {
  const res = await fetch(apiUrl(''), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ title: title, description: description, completed: false })
  });
  if (!res.ok) throw new Error('Could not add task (' + res.status + ')');
}

// PATCH existing task
async function updateTask(id, data) {
  const res = await fetch(apiUrl('?id=eq.' + id), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Could not update task (' + res.status + ')');
}

// DELETE task
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(apiUrl('?id=eq.' + id), {
      method: 'DELETE',
      headers: headers()
    });
    if (!res.ok) throw new Error('Could not delete task (' + res.status + ')');
    showStatus('');
    loadTasks();
  } catch (err) {
    showStatus('Error: ' + err.message);
  }
}

async function toggleTask(task) {
  try {
    await updateTask(task.id, { completed: !task.completed });
    showStatus('');
    loadTasks();
  } catch (err) {
    showStatus('Error: ' + err.message);
  }
}

function startEdit(task) {
  editingId = task.id;
  titleInput.value = task.title;
  descInput.value = task.description || '';
  submitBtn.textContent = 'Save changes';
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  submitBtn.textContent = 'Add task';
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (title === '') {
    showStatus('Title is required.');
    return;
  }

  try {
    if (editingId === null) {
      await addTask(title, description);
    } else {
      await updateTask(editingId, { title: title, description: description });
    }
    showStatus('');
    resetForm();
    loadTasks();
  } catch (err) {
    showStatus('Error: ' + err.message);
  }
});

// load config.json first, then tasks
async function init() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('Could not load config.json');
    config = await res.json();
    loadTasks();
  } catch (err) {
    showStatus('Error: ' + err.message);
  }
}

init();
