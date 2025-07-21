const { Pool } = require('pg');

// PostgreSQL 连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'image_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const initDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // 图片表
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        description TEXT,
        file_size BIGINT,
        width INTEGER,
        height INTEGER,
        format VARCHAR(50),
        thumbnail_path VARCHAR(500),
        original_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 图片分组表（支持多层级）
    await client.query(`
      CREATE TABLE IF NOT EXISTS image_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES image_groups(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 图片分组关联表
    await client.query(`
      CREATE TABLE IF NOT EXISTS image_group_relations (
        image_id VARCHAR(255),
        group_id INTEGER,
        PRIMARY KEY (image_id, group_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES image_groups(id) ON DELETE CASCADE
      )
    `);

    // 图片标签表
    await client.query(`
      CREATE TABLE IF NOT EXISTS image_tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 图片标签关联表
    await client.query(`
      CREATE TABLE IF NOT EXISTS image_tag_relations (
        image_id VARCHAR(255),
        tag_id INTEGER,
        PRIMARY KEY (image_id, tag_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES image_tags(id) ON DELETE CASCADE
      )
    `);

    // 用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // 用户会话表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      )
    `);

    // 插入系统默认标签
    await client.query(`
      INSERT INTO image_tags (name, color, is_system) VALUES
      ('建筑', '#EF4444', true),
      ('规划', '#F59E0B', true),
      ('景观', '#10B981', true),
      ('城市', '#3B82F6', true),
      ('乡村', '#8B5CF6', true),
      ('1K', '#6B7280', true),
      ('2K', '#6B7280', true),
      ('3K', '#6B7280', true),
      ('4K', '#6B7280', true),
      ('5K', '#6B7280', true),
      ('6K', '#6B7280', true),
      ('7K', '#6B7280', true),
      ('8K', '#6B7280', true)
      ON CONFLICT (name) DO NOTHING
    `);

    // 插入默认管理员用户（如果不存在）
    const adminExists = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO users (username, password_hash, email, role)
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 'admin@example.com', 'admin']);
      console.log('默认管理员用户已创建');
    }

    // 创建索引以提高查询性能
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_images_original_name ON images(original_name)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_images_description ON images(description)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_image_tags_name ON image_tags(name)
    `);

    client.release();
    console.log('PostgreSQL 数据库表创建完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 数据库查询辅助函数
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase, query };