// server.js
import Fastify from 'fastify';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Registrer CORS og static files
await fastify.register(import('@fastify/cors'), {
  origin: true
});

await fastify.register(import('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  setHeaders: (res, path) => {
    // Prevent caching during development
    if (path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache'); 
      res.setHeader('Expires', '0');
    }
  }
});

// ---- ROUTES ----

// Root route - serve HTML
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Reports route - serve reports HTML  
fastify.get('/reports', async (request, reply) => {
  return reply.sendFile('reports.html');
});

// ---- CLIENT ROUTES ----
// Hent alle kunder
fastify.get('/clients', async () => {
  const [rows] = await pool.query('SELECT * FROM clients ORDER BY name');
  return rows;
});

// Opret ny kunde
fastify.post('/clients', async (request, reply) => {
  try {
    const { name } = request.body;
    if (!name) {
      reply.code(400);
      return { error: 'Navn er påkrævet' };
    }
    const [result] = await pool.query('INSERT INTO clients (name) VALUES (?)', [name]);
    return { id: result.insertId, name };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke oprette kunde' };
  }
});

// Opdater kunde
fastify.put('/clients/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const { name } = request.body;
    
    if (!name) {
      reply.code(400);
      return { error: 'Navn er påkrævet' };
    }
    
    const [result] = await pool.query(
      'UPDATE clients SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, id]
    );
    
    if (result.affectedRows === 0) {
      reply.code(404);
      return { error: 'Kunde ikke fundet' };
    }
    
    return { id: parseInt(id), name };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke opdatere kunde' };
  }
});

// Slet kunde
fastify.delete('/clients/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Check if client has projects
    const [projects] = await pool.query('SELECT id FROM projects WHERE client_id = ?', [id]);
    
    if (projects.length > 0) {
      // Update projects to remove client_id reference
      await pool.query('UPDATE projects SET client_id = NULL WHERE client_id = ?', [id]);
    }
    
    const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      reply.code(404);
      return { error: 'Kunde ikke fundet' };
    }
    
    return { message: 'Kunde slettet succesfuldt' };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke slette kunde' };
  }
});

// ---- PROJECT ROUTES ----
// Hent alle projekter
fastify.get('/projects', async () => {
  const [rows] = await pool.query(`
    SELECT p.*, c.name as client_name 
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id 
    ORDER BY p.name
  `);
  return rows;
});

// Opret nyt projekt
fastify.post('/projects', async (request, reply) => {
  try {
    const { name, client_id } = request.body;
    if (!name) {
      reply.code(400);
      return { error: 'Navn er påkrævet' };
    }
    const [result] = await pool.query(
      'INSERT INTO projects (name, client_id) VALUES (?, ?)',
      [name, client_id || null]
    );
    return { id: result.insertId, name, client_id };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke oprette projekt' };
  }
});

// Opdater projekt
fastify.put('/projects/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, client_id } = request.body;
    
    if (!name) {
      reply.code(400);
      return { error: 'Navn er påkrævet' };
    }
    
    const [result] = await pool.query(
      'UPDATE projects SET name = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, client_id || null, id]
    );
    
    if (result.affectedRows === 0) {
      reply.code(404);
      return { error: 'Projekt ikke fundet' };
    }
    
    return { id: parseInt(id), name, client_id };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke opdatere projekt' };
  }
});

// Slet projekt
fastify.delete('/projects/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Check if project has tasks
    const [tasks] = await pool.query('SELECT id FROM tasks WHERE project_id = ?', [id]);
    
    if (tasks.length > 0) {
      // Update tasks to remove project_id reference
      await pool.query('UPDATE tasks SET project_id = NULL WHERE project_id = ?', [id]);
    }
    
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      reply.code(404);
      return { error: 'Projekt ikke fundet' };
    }
    
    return { message: 'Projekt slettet succesfuldt' };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke slette projekt' };
  }
});

// ---- TASK ROUTES ----
// Hent alle opgaver med projekt og kunde info
fastify.get('/tasks', async () => {
  const [rows] = await pool.query(`
    SELECT t.*, p.name as project_name, c.name as client_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY t.created_at DESC
  `);
  return rows;
});

// Opret ny opgave
fastify.post('/tasks', async (request, reply) => {
  try {
    const { title, project_id, is_recurring, recurrence_type, recurrence_interval, next_occurrence } = request.body;
    if (!title) {
      reply.code(400);
      return { error: 'Titel er påkrævet' };
    }
    
    const [result] = await pool.query(
      'INSERT INTO tasks (title, project_id, is_recurring, recurrence_type, recurrence_interval, next_occurrence) VALUES (?, ?, ?, ?, ?, ?)',
      [
        title, 
        project_id || null, 
        is_recurring || false,
        recurrence_type || null,
        recurrence_interval || 1,
        next_occurrence || null
      ]
    );
    
    return { 
      id: result.insertId, 
      title, 
      project_id: project_id || null,
      is_recurring: is_recurring || false,
      recurrence_type: recurrence_type || null,
      recurrence_interval: recurrence_interval || 1,
      next_occurrence: next_occurrence || null
    };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke oprette opgave' };
  }
});

// Opdater opgave
fastify.put('/tasks/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const { title, completed } = request.body;
    
    if (!title) {
      reply.code(400);
      return { error: 'Titel er påkrævet' };
    }
    
    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
      [title, completed || false, id]
    );
    
    if (result.affectedRows === 0) {
      reply.code(404);
      return { error: 'Opgave ikke fundet' };
    }
    
    return { id: parseInt(id), title, completed };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke opdatere opgave' };
  }
});

// Start tid på en opgave
fastify.post('/tasks/:id/start', async (request) => {
  const { id } = request.params;
  await pool.query(
    'UPDATE tasks SET last_start = NOW() WHERE id = ?',
    [id]
  );
  return { status: 'started', id };
});

// Stop tid på en opgave
fastify.post('/tasks/:id/stop', async (request, reply) => {
  try {
    const { id } = request.params;
    // Beregn tid brugt siden start
    await pool.query(`
      UPDATE tasks
      SET time_spent = time_spent + TIMESTAMPDIFF(SECOND, last_start, NOW()),
          last_start = NULL
      WHERE id = ?
    `, [id]);
    return { status: 'stopped', id };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke stoppe timer' };
  }
});

// Slet opgave
fastify.delete('/tasks/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    return { status: 'deleted', id };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke slette opgave' };
  }
});

// Marker opgave som fuldført
fastify.post('/tasks/:id/complete', async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Hent opgave detaljer først
    const [tasks] = await pool.query(`
      SELECT * FROM tasks WHERE id = ?
    `, [id]);
    
    if (tasks.length === 0) {
      reply.code(404);
      return { error: 'Opgave ikke fundet' };
    }
    
    const task = tasks[0];
    
    // Stop timer hvis den kører
    if (task.last_start) {
      await pool.query(`
        UPDATE tasks
        SET time_spent = time_spent + TIMESTAMPDIFF(SECOND, last_start, NOW()),
            last_start = NULL
        WHERE id = ?
      `, [id]);
    }
    
    // Marker som fuldført
    await pool.query(`
      UPDATE tasks 
      SET completed = TRUE, 
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);
    
    // Hvis det er en gentagen opgave, opret ny opgave
    let newTaskId = null;
    if (task.repeat_interval && task.repeat_interval !== '') {
      const [result] = await pool.query(`
        INSERT INTO tasks (title, project_id, repeat_interval, time_spent, completed, completed_at)
        VALUES (?, ?, ?, 0, FALSE, NULL)
      `, [task.title, task.project_id, task.repeat_interval]);
      newTaskId = result.insertId;
    }
    
    return { 
      status: 'completed', 
      id: parseInt(id),
      newTaskId: newTaskId,
      wasRepeating: !!task.repeat_interval 
    };
    
  } catch (error) {
    console.error('Fejl ved fuldførelse af opgave:', error);
    reply.code(500);
    return { error: 'Kunne ikke markere opgave som fuldført' };
  }
});

// Marker opgave som ikke-fuldført (genåbn)
fastify.post('/tasks/:id/uncomplete', async (request, reply) => {
  try {
    const { id } = request.params;
    
    await pool.query(`
      UPDATE tasks 
      SET completed = FALSE, 
          completed_at = NULL
      WHERE id = ?
    `, [id]);
    
    return { status: 'uncompleted', id: parseInt(id) };
    
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke genåbne opgave' };
  }
});

// ---- REPORTS ROUTES ----

// Tidsrapport - daglig/ugentlig/månedlig
fastify.get('/reports/time', async (request, reply) => {
  try {
    const { period = 'week', start_date, end_date } = request.query;
    
    let dateFilter = '';
    let groupBy = '';
    
    if (start_date && end_date) {
      dateFilter = `AND DATE(t.created_at) BETWEEN '${start_date}' AND '${end_date}'`;
    } else {
      switch(period) {
        case 'today':
          dateFilter = 'AND DATE(t.created_at) = CURDATE()';
          break;
        case 'week':
          dateFilter = 'AND YEARWEEK(t.created_at) = YEARWEEK(NOW())';
          groupBy = ', DATE(t.created_at)';
          break;
        case 'month':
          dateFilter = 'AND YEAR(t.created_at) = YEAR(NOW()) AND MONTH(t.created_at) = MONTH(NOW())';
          groupBy = ', DATE(t.created_at)';
          break;
      }
    }
    
    const [rows] = await pool.query(`
      SELECT 
        t.id, t.title, t.time_spent,
        p.name as project_name,
        c.name as client_name,
        DATE(t.created_at) as date
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE t.time_spent > 0 ${dateFilter}
      ORDER BY t.created_at DESC
    `);
    
    return rows;
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke generere tidsrapport' };
  }
});

// Projekt statistikker
fastify.get('/reports/projects', async (request, reply) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, p.name as project_name,
        c.name as client_name,
        COUNT(t.id) as task_count,
        SUM(t.time_spent) as total_time,
        AVG(t.time_spent) as avg_time_per_task,
        MIN(t.created_at) as first_task,
        MAX(t.created_at) as last_activity
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id, p.name, c.name
      HAVING task_count > 0
      ORDER BY total_time DESC
    `);
    
    return rows;
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke generere projekt statistikker' };
  }
});

// Kunde statistikker  
fastify.get('/reports/clients', async (request, reply) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id, c.name as client_name,
        COUNT(DISTINCT p.id) as project_count,
        COUNT(t.id) as task_count,
        SUM(t.time_spent) as total_time,
        AVG(t.time_spent) as avg_time_per_task
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY c.id, c.name
      HAVING task_count > 0
      ORDER BY total_time DESC
    `);
    
    return rows;
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke generere kunde statistikker' };
  }
});

// Produktivitets dashboard
fastify.get('/reports/productivity', async (request, reply) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(id) as total_tasks,
        SUM(time_spent) as total_time,
        AVG(time_spent) as avg_task_time,
        COUNT(CASE WHEN time_spent > 0 THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN last_start IS NOT NULL THEN 1 END) as active_tasks,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as tasks_today,
        COUNT(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN 1 END) as tasks_this_week
      FROM tasks
    `);
    
    const [dailyStats] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(id) as tasks_worked,
        SUM(time_spent) as time_spent,
        COUNT(DISTINCT 
          CASE WHEN project_id IS NOT NULL THEN project_id END
        ) as projects_active
      FROM tasks 
      WHERE time_spent > 0 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    const [timeDistribution] = await pool.query(`
      SELECT 
        HOUR(created_at) as hour,
        SUM(time_spent) as time_spent,
        COUNT(id) as task_count
      FROM tasks 
      WHERE time_spent > 0 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `);
    
    return {
      summary: stats[0],
      daily_trends: dailyStats,
      hourly_distribution: timeDistribution
    };
  } catch (error) {
    reply.code(500);
    return { error: 'Kunne ikke generere produktivitets rapport' };
  }
});

// Get all recurring completions
fastify.get('/recurring-completions', async (request, reply) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM recurring_task_completions ORDER BY completion_date DESC'
        );
        reply.send(rows);
    } catch (error) {
        console.error('Database error:', error);
        reply.status(500).send({ error: 'Database error' });
    }
});

// Complete a recurring task for a specific date
fastify.post('/tasks/:id/complete-recurring', async (request, reply) => {
    const { id } = request.params;
    const { date } = request.body;
    
    try {
        await pool.execute(
            'INSERT INTO recurring_task_completions (task_id, completion_date, completed_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE completed_at = NOW()',
            [id, date]
        );
        reply.send({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        reply.status(500).send({ error: 'Database error' });
    }
});

// Uncomplete a recurring task for a specific date
fastify.post('/tasks/:id/uncomplete-recurring', async (request, reply) => {
    const { id } = request.params;
    const { date } = request.body;
    
    try {
        await pool.execute(
            'DELETE FROM recurring_task_completions WHERE task_id = ? AND completion_date = ?',
            [id, date]
        );
        reply.send({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        reply.status(500).send({ error: 'Database error' });
    }
});

// ---- SERVER START ----
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server kører på http://127.0.0.1:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();