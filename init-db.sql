-- 创建数据库（如果不存在）
CREATE DATABASE image_manager;

-- 连接到数据库
\c image_manager;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 这个文件主要是为了确保数据库存在
-- 实际的表结构会由应用程序在启动时创建