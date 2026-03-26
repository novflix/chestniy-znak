const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async register({ email, password, role = 'USER' }) {
    // Check if email is taken
    const exists = await userRepository.emailExists(email);
    if (exists) {
      throw { status: 409, message: 'Email уже используется.' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await userRepository.create({ email, passwordHash, role });

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw { status: 401, message: 'Неверный email или пароль.' };
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw { status: 401, message: 'Неверный email или пароль.' };
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token: this.generateToken(user.id) };
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Get cookie options for HttpOnly JWT
   */
  getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }
}

module.exports = new AuthService();
