import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name as category_name 
       FROM expenses e 
       LEFT JOIN categories c ON e.category_id = c.id 
       WHERE e.user_id = $1 
       ORDER BY e.date DESC`,
      [req.userId]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  const { title, amount, date, note, category_id } = req.body;

  if (!title || !amount || !date) {
    return res.status(400).json({ message: 'Title, amount and date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (user_id, title, amount, date, note, category_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.userId, title, amount, date, note || null, category_id || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, amount, date, note, category_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE expenses 
       SET title = $1, amount = $2, date = $3, note = $4, category_id = $5 
       WHERE id = $6 AND user_id = $7 
       RETURNING *`,
      [title, amount, date, note || null, category_id || null, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.json({ message: 'Expense deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};