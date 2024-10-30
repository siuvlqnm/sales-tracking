#!/bin/bash

# 清理旧的部署文件
rm -rf deploy deploy.zip

# 构建 Next.js 项目
npm run build

# 创建部署目录
mkdir deploy

# 复制文件
cp -r out/ deploy/
cp -r functions/ deploy/
cp package.json deploy/
cp package-lock.json deploy/  # 如果有的话

# 创建 zip 文件
cd deploy
zip -r ../deploy.zip ./*

# 清理部署目录
cd ..
rm -rf deploy

echo "部署包已创建: deploy.zip" 