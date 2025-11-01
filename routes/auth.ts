import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { validate } from '../validate.js';
import { registerSchema, loginSchema, RegisterRequest, LoginRequest } from '../schemas.js';

const router = Router();

router.post(
  '/register',
  validate(registerSchema, 'body'),
  async (req: RegisterRequest, res: Response) => {
    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = new User({ email, password });
      await user.save();

      const token = generateToken(user._id.toString());

      return res.status(201).json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

router.post(
  '/login',
  validate(loginSchema, 'body'),
  async (req: LoginRequest, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user._id.toString());

      return res.status(200).json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to login' });
    }
  }
);

export default router;

