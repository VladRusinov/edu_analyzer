docker run \
  --name edu_analyzer-postgres \
  -e POSTGRES_DB=edu_analyzer \
  -e POSTGRES_USER=edu_analyzer_user \
  -e POSTGRES_PASSWORD=edu_analyzer_password \
  -p 5433:5432 \
  -v edu_analyzer_pgdata:/var/lib/postgresql/data \
  -d postgres:16