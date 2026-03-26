const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async register({ email, password, role = 'USER' }) {
    if (await userRepository.emailExists(email)) {
      throw { status: 409, message: 'Email уже используется.' };
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({ email, passwordHash, role });
    return { user, token: this.generateToken(user.id) };
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
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}

module.exports = new AuthService();
