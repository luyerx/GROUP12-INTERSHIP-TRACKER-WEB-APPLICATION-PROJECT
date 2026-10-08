# Historical Development Note

This document records an earlier development state and is retained for project history.
For the current implementation, see [README.md](../README.md), [final AI implementation](AI_IMPLEMENTATION_SUMMARY.md) and the [documentation index](README.md). Dates, test counts, file status and earlier configuration below describe that earlier pass, not the current submission state.

---

# Sep 10 SZY Update

日期：2026-09-10

## 更新概览

本次更新将项目从部分静态演示数据推进为 MongoDB 驱动的动态系统，重点完善了用户身份、数据隔离、管理员功能、资源管理、机会管理和日历事件持久化。

## 用户与认证

- Dashboard 欢迎语改为从 `/api/auth/me` 读取当前登录用户，不再使用固定的 `Yanzhen`。
- Profile 页面从数据库加载当前用户资料。
- Profile 保存功能改为通过 `PATCH /api/profile` 写入 MongoDB。
- 用户资料支持动态保存：
  - 姓名和邮箱
  - 学校、学位、专业和毕业年份
  - 所在地
  - 偏好职位和偏好地点
  - 技能
  - 是否开放实习
  - 邮件、截止日期和面试提醒设置
- `AuthenticatedUser` 返回完整的用户资料字段。
- 用户模型增加账户状态字段：`Active` 或 `Suspended`。

## 申请数据隔离

- Application 模型增加必填 `userId` 字段，并建立用户索引。
- 新增申请时自动绑定当前登录用户。
- 查询申请列表时只返回当前用户的数据。
- 申请详情、修改、状态更新和删除操作都会同时匹配申请 ID 与当前用户 ID。
- 管理员账号不能访问学生申请 API，学生账号也不能访问管理员 API。
- 原有 11 条申请已迁移并绑定到测试学生账号。
- 已验证数据库中申请记录全部拥有有效用户归属：

```text
total: 11
owned: 11
missing: 0
```

## 新增数据库模型

新增以下 Mongoose 模型：

- `Resource`：共享职业资源
- `Opportunity`：管理员发布的实习或毕业机会
- `CalendarEvent`：学生个人日历事件
- `User.status`：用户账户状态

现有 `Application` 和 `User` 模型也已扩展，用于实现用户关联和完整资料存储。

## 管理员功能动态化

管理员页面不再使用 `localStorage` 或 `adminDemoData`：

- 管理员 Dashboard 从数据库读取用户、机会、资源和申请统计。
- 资源管理支持从数据库加载、新增、编辑和删除。
- 机会管理支持从数据库加载、新增、编辑和删除。
- 用户管理支持从数据库加载、修改专业/项目、修改角色、修改账户状态和删除用户。
- 管理员不能删除自己的账号。
- 原有管理员资源和机会演示数据已迁移到 MongoDB。

当前数据库共享内容：

```text
Resources: 12
Opportunities: 4
Applications: 11
Calendar events: 0
```

## 学生资源页

- 学生资源页改为请求 `/api/resources`。
- 页面只显示数据库中状态为 `Published` 的资源。
- 搜索、分类筛选、类型筛选和 Featured 展示继续由前端根据 API 返回数据完成。
- 已移除页面内置的 8 条静态资源和管理员资源的 localStorage 合并逻辑。

## 日历事件

- 申请截止日期继续从当前用户的申请数据动态生成。
- 手动日历事件改为数据库持久化。
- 新增、编辑和删除事件刷新页面后仍然保留。
- 日历事件按 `userId` 隔离，不同学生账号不能互相查看或修改事件。
- 自动生成的申请截止日期不能直接删除。

## 新增 API

### 用户资料

- `PATCH /api/profile`

### 学生资源

- `GET /api/resources`

### 管理员共享内容

- `GET /api/admin/content?kind=resources`
- `GET /api/admin/content?kind=opportunities`
- `POST /api/admin/content?kind=resources`
- `POST /api/admin/content?kind=opportunities`
- `PUT /api/admin/content/:id?kind=resources`
- `PUT /api/admin/content/:id?kind=opportunities`
- `DELETE /api/admin/content/:id?kind=resources`
- `DELETE /api/admin/content/:id?kind=opportunities`

### 管理员用户

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

### 学生日历事件

- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

## 数据迁移与辅助脚本

新增脚本：

- `scripts/backfill-application-owners.mjs`
  - 将没有 `userId` 的旧申请绑定到指定用户。
- `scripts/seed-content.mjs`
  - 将资源和机会初始数据写入 MongoDB。

示例：

```bash
APPLICATION_OWNER_EMAIL=test.student@example.com \
node --env-file=.env scripts/backfill-application-owners.mjs

node --env-file=.env scripts/seed-content.mjs
```

## 测试账号与测试数据

### 学生测试账号一

- 邮箱：`test.student@example.com`
- 密码：`test1234`
- 申请数据：11 条

### 学生测试账号二

- 邮箱：`demo.student@example.com`
- 密码：`demo1234`
- 申请数据：3 条
- 日历事件：1 条

测试账号二的数据包括：

- Rocket Lab：Interested
- Fisher & Paykel：Applied
- Trade Me：Interview
- Technical interview：2026-09-24

### 管理员测试账号

- 邮箱：`admin.test@example.com`
- 密码：`admin1234`
- 角色：`admin`

管理员测试账号已验证可以访问管理员 Dashboard、用户列表、资源和机会，但不能访问学生申请 API。

## 已删除的静态数据源

以下旧数据源已移除或不再使用：

- `lib/currentUser.ts`
- `lib/applicationsStore.ts`
- `lib/adminDemoData.ts`
- `lib/useAdminDemoData.ts`
- 页面内置的固定申请、资源和管理员演示数据
- 日历手动事件的 `setTimeout` 模拟保存
- 管理员页面的 `localStorage` 保存逻辑

## 验证结果

已执行并通过：

```bash
npm run lint
npm run build
```

同时验证了：

- 学生登录后只能看到自己的申请和日历事件。
- 管理员登录后可以读取管理员数据和共享内容。
- 管理员不能访问学生申请接口。
- 申请新增、修改、状态更新和删除都会写入 MongoDB。
- Profile 修改刷新后仍然保留。
- 资源、机会和日历事件刷新后仍然保留。

## 当前运行方式

```bash
npm run dev
```

本地地址：`http://localhost:3000`

MongoDB 配置通过 `.env` 中的 `MONGODB_URI` 和 `MONGODB_DB` 提供。
