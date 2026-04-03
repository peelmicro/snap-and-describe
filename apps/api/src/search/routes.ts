import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../db/index.ts";

export async function searchRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { q: string; page?: string; limit?: string };
  }>("/search", async (request, reply) => {
    const { q, page: pageStr, limit: limitStr } = request.query;

    if (!q?.trim()) {
      return reply.status(400).send({ error: "Query parameter 'q' is required" });
    }

    const page = Math.max(1, Number(pageStr) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitStr) || 20));
    const offset = (page - 1) * limit;
    const query = q.trim();
    const likePattern = `%${query}%`;

    const results = await db.execute(sql.raw(`
      SELECT *,
        ts_rank(
          to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(name, '') || ' ' || COALESCE(suggested_name, '')),
          plainto_tsquery('english', '${query.replace(/'/g, "''")}')
        ) AS rank
      FROM images
      WHERE
        to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(name, '') || ' ' || COALESCE(suggested_name, ''))
        @@ plainto_tsquery('english', '${query.replace(/'/g, "''")}')
        OR tags::text ILIKE '${likePattern.replace(/'/g, "''")}'
        OR description ILIKE '${likePattern.replace(/'/g, "''")}'
        OR name ILIKE '${likePattern.replace(/'/g, "''")}'
        OR suggested_name ILIKE '${likePattern.replace(/'/g, "''")}'
      ORDER BY rank DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `));

    const countResult = await db.execute(sql.raw(`
      SELECT count(*) as total FROM images
      WHERE
        to_tsvector('english', COALESCE(description, '') || ' ' || COALESCE(name, '') || ' ' || COALESCE(suggested_name, ''))
        @@ plainto_tsquery('english', '${query.replace(/'/g, "''")}')
        OR tags::text ILIKE '${likePattern.replace(/'/g, "''")}'
        OR description ILIKE '${likePattern.replace(/'/g, "''")}'
        OR name ILIKE '${likePattern.replace(/'/g, "''")}'
        OR suggested_name ILIKE '${likePattern.replace(/'/g, "''")}'
    `));

    const total = Number(countResult[0]?.total || 0);

    return {
      query: q,
      items: results,
      page,
      limit,
      total,
    };
  });
}
