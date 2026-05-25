export default async function globalTeardown() {
  // Docker container stays running for local inspection.
  // Stop it with: docker compose -f docker-compose.test.yml down
}
