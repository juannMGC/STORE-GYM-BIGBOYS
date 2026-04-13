-- Marcador de orden para despliegues: la tabla `PushSubscription` se crea en
-- `20260419120000_add_push_subscriptions` (mismo esquema que el SQL detallado en la guía).
-- Esta migración evita reintentar CREATE si la tabla ya existe en bases actualizadas.
SELECT 1;
