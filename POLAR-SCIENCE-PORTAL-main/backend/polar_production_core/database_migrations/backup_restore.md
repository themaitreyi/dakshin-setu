# Database Backup and Restore Guide

### PostgreSQL Backup
```bash
pg_dump -U polar_user -h localhost -d dakshinsetu -F c -b -v -f /backups/dakshinsetu_$(date +%Y%m%d).dump
```

### PostgreSQL Restore
```bash
pg_restore -U polar_user -h localhost -d dakshinsetu -v /backups/dakshinsetu_20260930.dump
```

### SQLite Fallback Backup
```bash
sqlite3 repository.sqlite ".backup 'repository_backup.sqlite'"
```
