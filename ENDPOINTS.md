# Endpoints de UA-Habitual

## Autenticación
- `POST /register` - Registrar nuevo usuario
  - Body: `{ username, email, password }`
- `POST /login` - Login de usuario
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, username, email, score, streak, rank_id } }`

## Perfil de Usuario
- `GET /profile` (protegido) - Obtener perfil del usuario autenticado
- `GET /users/:user_id` - Obtener perfil público de otro usuario
- `PUT /profile` (protegido) - Actualizar email/password
  - Body: `{ email?, password? }`
- `GET /leaderboard` - Obtener ranking de usuarios
  - Query: `limit`, `offset`, `category` (opcional)
- `GET /users/search` - Buscar usuarios por username
  - Query: `q` (al menos 2 caracteres)

## Comunidades
- `GET /communities` - Listar todas las comunidades
- `GET /communities/:id` - Obtener comunidad específica
- `GET /communities/:id/members` - Listar miembros de la comunidad
- `GET /user/communities` (protegido) - Obtener comunidades del usuario
- `POST /communities` (protegido) - Crear nueva comunidad
  - Body: `{ name, description, category }`
- `POST /communities/:id/join` (protegido) - Unirse a comunidad
- `DELETE /communities/:id/leave` (protegido) - Salir de comunidad

## Posts
- `GET /posts/:id` - Obtener post específico
- `GET /community/:community_id/posts` - Listar posts de la comunidad
- `GET /posts/user` (protegido) - Listar posts del usuario autenticado
- `GET /posts/feed/following` (protegido) - Feed de posts de usuarios que sigue
- `POST /posts` (protegido) - Crear nuevo post
  - Body: `{ content, community_id }`
- `DELETE /posts/:id` (protegido) - Eliminar post propio

## Commentarios
- `GET /posts/:post_id/comments` - Listar comentarios del post
- `GET /posts/:post_id/comments/nested` - Obtener comentarios anidados
- `POST /comments` (protegido) - Crear comentario
  - Body: `{ post_id, content, parent_id? }`
- `DELETE /comments/:id` (protegido) - Eliminar comentario propio

## Likes
- `GET /posts/:post_id/likes` - Listar usuarios que dieron like
- `GET /posts/:post_id/likes/count` - Contar likes del post
- `GET /posts/:post_id/user-like` (protegido) - Verificar si usuario dio like
- `POST /posts/:post_id/like` (protegido) - Dar like a post
- `DELETE /posts/:post_id/like` (protegido) - Quitar like

## Follows
- `GET /users/:user_id/followers` - Listar seguidores del usuario
- `GET /users/:user_id/following` - Listar usuarios que sigue
- `GET /users/:user_id/followers/count` - Contar seguidores
- `GET /users/:user_id/following/count` - Contar siguiendo
- `GET /users/:user_id/is-following` (protegido) - Verificar si sigue usuario
- `POST /users/:user_id/follow` (protegido) - Seguir usuario
- `DELETE /users/:user_id/unfollow` (protegido) - Dejar de seguir usuario

## Goals
- `GET /goals` (protegido) - Listar goals del usuario
  - Query: `status` (pending o completed)
- `GET /goals/:id` (protegido) - Obtener goal específico
- `POST /goals` (protegido) - Crear nuevo goal
  - Body: `{ title, description, difficulty, community_id }`
  - Difficulty: easy, medium, hard
- `PUT /goals/:id` (protegido) - Actualizar goal
  - Body: `{ title?, description?, difficulty? }`
- `PATCH /goals/:id/complete` (protegido) - Marcar goal como completado
- `DELETE /goals/:id` (protegido) - Eliminar goal

## Notas importantes
- Todos los endpoints están disponibles sin prefijo `/api` y con prefijo `/api`
- Los endpoints protegidos requieren header: `Authorization: Bearer <token_jwt>`
- El token JWT dura 1 hora
- Las comunidades disponibles incluyen: running, pintura, chino, inglés, holandés, literatura, escalada, karate, guitarra, cocina, programación, ajedrez, boxeo, coser, fotografía, yoga, jardinería, meditación, baile, ciclismo, escritura, cine, astronomía, diseño gráfico
