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

-- 1. 为 sales_records 表添加索引以优化查询性能
CREATE INDEX idx_sales_submit_ts ON sales_records(submit_ts);
CREATE INDEX idx_sales_store_user ON sales_records(store_id, user_id);
CREATE INDEX idx_sales_deleted_at ON sales_records(deleted_at);

-- 2. 为 user_store_rel 表添加外键约束和索引
ALTER TABLE user_store_rel
ADD CONSTRAINT fk_user_store_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE user_store_rel
ADD CONSTRAINT fk_user_store_store
FOREIGN KEY (store_id) REFERENCES stores(store_id);

CREATE INDEX idx_user_store_store_id ON user_store_rel(store_id);

-- 3. 为 sales_records 表添加外键约束
ALTER TABLE sales_records
ADD CONSTRAINT fk_sales_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE sales_records
ADD CONSTRAINT fk_sales_store
FOREIGN KEY (store_id) REFERENCES stores(store_id);

ALTER TABLE sales_records
ADD CONSTRAINT fk_sales_product
FOREIGN KEY (product_id) REFERENCES products(product_id);

-- 4. 为 sales_records 表的 deleted_by 添加外键约束
ALTER TABLE sales_records
ADD CONSTRAINT fk_sales_deleted_by
FOREIGN KEY (deleted_by) REFERENCES users(user_id);