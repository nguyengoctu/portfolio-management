# Flyway Migration Setup

## Thay đổi từ Spring Auto-update sang Flyway

### Cấu trúc mới:
```
db/
├── migrations/
│   ├── V1__Create_users_table.sql
│   └── V2__Create_password_reset_token_table.sql
└── flyway.conf
```

### Flyway Container:
- Container `flyway-migrate` chạy riêng biệt từ application services
- Chạy migrations trước khi start auth-service và user-service
- Sử dụng `service_completed_successfully` để đảm bảo migration hoàn thành

### Cách chạy:

1. **Khởi tạo database mới:**
   ```bash
   docker compose up flyway-migrate
   ```

2. **Chạy full stack:**
   ```bash
   docker compose up
   ```

3. **Thêm migration mới:**
   - Tạo file `V{số}__Ten_migration.sql` trong `db/migrations/`
   - Restart flyway-migrate: `docker compose up flyway-migrate`

### Lợi ích:
- ✅ Tách biệt database migration khỏi application
- ✅ Có thể scale services mà không lo conflict migration
- ✅ Database schema được version control
- ✅ Rollback được nếu cần
- ✅ Production-ready approach