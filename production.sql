CREATE TABLE IF NOT EXISTS "sales_records" (
	"id" INTEGER NOT NULL UNIQUE,
	"order_no" TEXT NOT NULL UNIQUE,
	-- 员工 ID
	"user_id" TEXT NOT NULL,
	-- 门店 ID
	"store_id" TEXT NOT NULL,
	-- 实际金额
	"actual_amount" REAL NOT NULL,
	-- 提交时间
	"submit_ts" INTEGER NOT NULL,
	-- 会员名称
	"customer_name" TEXT NOT NULL,
	-- 手机号
	"phone" TEXT,
	-- 卡项
	"product_id" TEXT NOT NULL,
	-- 备注
	"notes" TEXT,
	-- 删除原因
	"delete_reason" TEXT,
	-- 删除人
	"deleted_by" TEXT,
	-- 删除时间
	"deleted_at" DATETIME,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "stores" (
	-- 门店 ID
	"store_id" TEXT NOT NULL UNIQUE,
	-- 门店名称
	"store_name" TEXT NOT NULL,
	-- 门店状态：1.启用、2.禁用
	"store_status" INTEGER NOT NULL DEFAULT 1,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY("store_id")
);

CREATE TABLE IF NOT EXISTS "users" (
	-- 员工 ID
	"user_id" TEXT NOT NULL UNIQUE,
	-- 员工名称
	"user_name" TEXT NOT NULL,
	-- 角色类型：1.店长、2.员工 
	"role_type" INTEGER NOT NULL DEFAULT 2,
	-- 在职状态：1.启用、2.禁用
	"employment_status" INTEGER NOT NULL DEFAULT 1,
	"updated_at" DATETIME,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY("user_id")
);

CREATE TABLE IF NOT EXISTS "user_store_rel" (
	-- 员工 ID
	"user_id" TEXT NOT NULL,
	-- 门店 ID
	"store_id" TEXT NOT NULL,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY("user_id", "store_id")
);

CREATE TABLE IF NOT EXISTS "admins" (
	"id" INTEGER NOT NULL UNIQUE,
	-- 管理员名称
	"admin_name" TEXT NOT NULL UNIQUE,
	-- 密码
	"pwd_hash" TEXT NOT NULL UNIQUE,
	"token" TEXT NOT NULL,
	-- token 过期时间
	"token_expires" DATETIME NOT NULL,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "products" (
	"product_id" TEXT NOT NULL UNIQUE,
	"product_name" TEXT NOT NULL,
	-- 是否启用：1.启用、2.禁用
	"product_status" INTEGER NOT NULL DEFAULT 1,
	"updated_at" DATETIME,
	"created_at" DATETIME NOT NULL,
	PRIMARY KEY("product_id")
);

-- 1. 首先添加索引来优化查询性能
CREATE INDEX IF NOT EXISTS idx_sales_submit_ts ON sales_records(submit_ts);
CREATE INDEX IF NOT EXISTS idx_sales_store_user ON sales_records(store_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales_records(deleted_at);
CREATE INDEX IF NOT EXISTS idx_user_store_store_id ON user_store_rel(store_id);

-- 2. 重新创建 user_store_rel 表以添加外键约束
CREATE TABLE IF NOT EXISTS "user_store_rel_new" (
    "user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    PRIMARY KEY("user_id", "store_id"),
    FOREIGN KEY("user_id") REFERENCES users("user_id"),
    FOREIGN KEY("store_id") REFERENCES stores("store_id")
);

-- 3. 迁移数据
INSERT INTO user_store_rel_new SELECT * FROM user_store_rel;

-- 4. 删除旧表并重命名新表
DROP TABLE user_store_rel;
ALTER TABLE user_store_rel_new RENAME TO user_store_rel;

-- 5. 重新创建 sales_records 表以添加外键约束
CREATE TABLE IF NOT EXISTS "sales_records_new" (
    "id" INTEGER NOT NULL UNIQUE,
    "order_no" TEXT NOT NULL UNIQUE,
    "user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "actual_amount" REAL NOT NULL CHECK(actual_amount >= 0),
    "submit_ts" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL,
    "phone" TEXT,
    "product_id" TEXT NOT NULL,
    "notes" TEXT,
    "delete_reason" TEXT,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("user_id") REFERENCES users("user_id"),
    FOREIGN KEY("store_id") REFERENCES stores("store_id"),
    FOREIGN KEY("product_id") REFERENCES products("product_id"),
    FOREIGN KEY("deleted_by") REFERENCES users("user_id")
);

-- 6. 迁移数据
INSERT INTO sales_records_new SELECT * FROM sales_records;

-- 7. 删除旧表并重命名新表
DROP TABLE sales_records;
ALTER TABLE sales_records_new RENAME TO sales_records;
