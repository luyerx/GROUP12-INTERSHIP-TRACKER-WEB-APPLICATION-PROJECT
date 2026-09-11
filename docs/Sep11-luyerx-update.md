# luyerx 项目更新记录

日期：2026-09-10
作者：luyerx <luyerx825@gmail.com>

## 更新概览

本次工作主要围绕管理员数据统计、数据校验、账号安全和密码恢复流程展开，修复了管理员 Dashboard 统计异常，并补齐了多个认证和数据隔离缺口。

## 管理员 Dashboard 统计

修复了管理员 Dashboard 的申请总数一直显示为 `0` 的问题。

问题原因：

- 管理员 Dashboard 原来请求学生专用的 `/api/applications`。
- 该接口只允许 `student` 角色访问。
- 管理员请求收到 `403` 后，前端保留默认值 `0`。

解决方案：

- 新增 `GET /api/admin/stats`。
- 该接口只允许管理员访问。
- 从 MongoDB 统计全部申请数量。
- 管理员 Dashboard 改为读取管理员统计接口。

验证结果：

```text
Admin applications: 14
```

相关文件：

- `app/api/admin/stats/route.ts`
- `app/admin/dashboard/page.tsx`

## 管理员内容 API 校验

管理员资源和机会 API 现在严格校验 `kind` 参数，只允许：

- `resources`
- `opportunities`

缺少参数或传入未知类型时返回 `400`，不会再默认进入机会数据分支。

相关文件：

- `app/api/admin/content/route.ts`
- `app/api/admin/content/[id]/route.ts`

验证示例：

```text
/api/admin/content?kind=invalid
400 A valid content kind is required.
```

## 日历事件数据隔离

日历事件创建和更新时，现在会验证关联的申请是否属于当前登录用户。

改进内容：

- 事件继续通过 `userId` 隔离。
- 创建事件前检查 `applicationId` 是否属于当前用户。
- 修改事件时同样检查新的 `applicationId`。
- 跨用户关联申请会被拒绝。

相关文件：

- `lib/eventsRepository.ts`
- `app/api/events/route.ts`
- `app/api/events/[id]/route.ts`

验证结果：

```text
The selected application does not belong to this user.
```

## 密码重置流程

原来的忘记密码页面只是等待一秒后显示成功，现在已经改为真实的 token 重置流程。

实现内容：

- 新增 `PasswordResetToken` 数据模型。
- 重置 token 只保存 SHA-256 hash，不保存明文 token。
- token 有效期为 30 分钟。
- 同一用户创建新 token 时会删除旧 token。
- 重置密码后会删除用户现有 session，强制重新登录。
- 新增 `/reset-password` 页面。
- 开发环境返回重置入口，方便本地测试。
- 不存在的邮箱使用统一响应，避免泄露账号是否存在。

新增接口：

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

相关文件：

- `lib/models/PasswordResetToken.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/reset-password/page.tsx`
- `app/forgot-password/page.tsx`

验证结果：

```text
Password reset successfully.
Login successful.
```

## 登录、注册和密码重置限流

新增进程内限流器，降低暴力尝试和接口滥用风险。

当前限制：

- 登录：同一客户端 15 分钟最多 10 次。
- 注册：同一客户端 1 小时最多 5 次。
- 忘记密码：同一客户端 15 分钟最多 5 次。
- 超过限制返回 HTTP `429` 和 `Retry-After` 响应头。

相关文件：

- `lib/rateLimit.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/forgot-password/route.ts`

验证结果：

```text
11th login response: 429
Too many login attempts. Please try again later.
```

## 停用账号安全

补充了 `Suspended` 用户的访问控制：

- 停用账号无法新建登录 session。
- 已有 session 在认证时会失效。
- 停用用户无法继续访问受保护的学生或管理员功能。

相关文件：

- `lib/auth.ts`
- `app/api/auth/login/route.ts`

## 数据库与动态系统基础

本次工作基于此前已经完成的数据库动态化功能：

- 申请数据通过 `userId` 实现用户隔离。
- Resource、Opportunity 和 CalendarEvent 使用 MongoDB 模型。
- 管理员资源、机会和用户页面使用数据库 API。
- Profile 数据通过 MongoDB 持久化。
- 学生资源、日历事件和申请数据刷新后仍然保留。

## 验证结果

已通过：

```bash
npm run lint
npm run build
```

另外验证了：

- 管理员统计接口返回真实申请数量。
- 管理员非法 `kind` 参数被拒绝。
- 跨用户日历事件关联被拒绝。
- 密码重置 token 流程可以完成密码更新。
- 密码重置后用户可以重新登录。
- 登录超过限制后返回 `429`。
- 停用用户不能登录或使用旧 session。

## 生产环境注意事项

- 密码重置 token 已安全存储，但生产环境仍需接入邮件服务发送重置链接。
- 当前限流器使用进程内内存；多实例部署时应迁移到 Redis 等共享存储。
- MongoDB 连接字符串必须使用环境变量，不能提交到 Git。
- 测试账号和测试密码只应在本地或受控测试环境使用。
